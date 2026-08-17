"""
ML model interface for donor matching.

Current state: baseline weighted scoring algorithm.
Architecture is prepared for XGBoost upgrade when labelled training data
from real donation outcomes is available.

IMPORTANT:
- Do not claim specific accuracy metrics for this system.
- Accuracy claims require evaluation against a held-out test set from real data.
- XGBoost training pipeline is scaffolded but NOT trained — it requires
  legitimate historical donation outcome data to function.
"""
from dataclasses import dataclass
from typing import Optional
import logging
import os

logger = logging.getLogger(__name__)

MODEL_VERSION = "baseline-v1"
MODEL_NOTE = (
    "This system uses a transparent weighted scoring algorithm. "
    "An XGBoost model can be trained when sufficient labelled outcome data is available. "
    "No accuracy claim is made for the current baseline implementation."
)


@dataclass
class PredictionResult:
    """Result from the model interface."""
    overall_score: float        # 0–100
    features: dict              # raw feature values
    model_version: str          # which model produced this
    explanation: Optional[dict] = None  # SHAP values when available


class DonorMatchModel:
    """
    Model interface for donor-request compatibility scoring.

    Currently wraps the baseline algorithm.
    When legitimate training data is available:
    1. Train XGBoost on historical (donor, request, outcome) triplets
    2. Call self._load_xgboost_model() to replace baseline
    3. Use SHAP for per-prediction explanations
    """

    def __init__(self):
        self.model = None
        self.model_version = MODEL_VERSION
        self._try_load_model()

    def _try_load_model(self):
        """Attempt to load a trained XGBoost model if one exists."""
        model_path = os.path.join(os.path.dirname(__file__), "trained_model.joblib")
        if os.path.exists(model_path):
            try:
                import joblib
                self.model = joblib.load(model_path)
                self.model_version = "xgboost-v1"
                logger.info("Loaded trained XGBoost donor matching model.")
            except Exception as e:
                logger.warning(f"Could not load trained model: {e}. Using baseline.")
        else:
            logger.info("No trained model found. Using baseline weighted scoring.")

    def predict(self, features: dict) -> PredictionResult:
        """
        Score a (donor, request) feature vector.
        Falls back to baseline if no trained model is loaded.
        """
        if self.model is not None:
            return self._predict_xgboost(features)
        return self._predict_baseline(features)

    def _predict_baseline(self, features: dict) -> PredictionResult:
        """
        Transparent weighted scoring — no black box.
        Weights match those in matching.py WEIGHTS dict.
        """
        from .matching import WEIGHTS, compute_overall_score
        overall = compute_overall_score(features)
        return PredictionResult(
            overall_score=overall,
            features=features,
            model_version=self.model_version,
        )

    def _predict_xgboost(self, features: dict) -> PredictionResult:
        """
        XGBoost prediction — only runs when a trained model is loaded.
        Requires: scikit-learn compatible XGBoost model
        """
        import numpy as np
        feature_vector = [
            features.get("compatibility_score", 0),
            features.get("availability_score", 0),
            features.get("distance_score", 0),
            features.get("eligibility_score", 0),
            features.get("history_score", 0),
        ]
        X = np.array([feature_vector])
        score = float(self.model.predict(X)[0]) * 100
        score = max(0.0, min(100.0, score))

        explanation = None
        try:
            import shap
            explainer = shap.TreeExplainer(self.model)
            shap_values = explainer.shap_values(X)
            explanation = {
                "shap_values": shap_values[0].tolist(),
                "feature_names": list(features.keys()),
            }
        except Exception:
            pass  # SHAP not available — continue without explanation

        return PredictionResult(
            overall_score=score,
            features=features,
            model_version=self.model_version,
            explanation=explanation,
        )


# ── Training pipeline scaffold ────────────────────────────────────────────────

def train_model(X_train, y_train, model_output_path: str):
    """
    Train an XGBoost donor matching model.

    Call this function only when you have legitimate labelled training data
    consisting of (donor_features, request_features, outcome) records
    where outcome = 1 for successful donation, 0 for unsuccessful.

    Args:
        X_train: numpy array of feature vectors
        y_train: numpy array of binary labels (1=success, 0=failure)
        model_output_path: path to save the trained model

    IMPORTANT: Do not fabricate training data. Model accuracy claims
    require evaluation against a real held-out test set.
    """
    try:
        from xgboost import XGBClassifier
        import joblib

        model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )
        model.fit(X_train, y_train)
        joblib.dump(model, model_output_path)
        logger.info(f"Trained XGBoost model saved to {model_output_path}")
        return model
    except ImportError:
        logger.error("XGBoost is not installed. Install it with: pip install xgboost")
        raise


# Module-level singleton
_model_instance: Optional[DonorMatchModel] = None


def get_model() -> DonorMatchModel:
    global _model_instance
    if _model_instance is None:
        _model_instance = DonorMatchModel()
    return _model_instance
