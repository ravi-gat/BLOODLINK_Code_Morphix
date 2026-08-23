"""
Blood group compatibility service.

This module implements standard red-cell transfusion compatibility rules
for informational donor-matching purposes only.

IMPORTANT MEDICAL DISCLAIMER:
These rules represent general red-cell compatibility guidelines.
This software tool is NOT a substitute for clinical transfusion protocols,
pre-transfusion testing, or decisions made by qualified medical professionals.
Blood transfusion decisions must always be made by licensed clinicians
following institutional and regulatory protocols.
"""
from ..models.enums import BloodGroup

# ── Red-cell transfusion compatibility ───────────────────────────────────────
# Key: recipient blood group → set of compatible donor blood groups
# Based on standard ABO/Rh compatibility for red-cell transfusions.
# Source: general transfusion medicine reference.
RED_CELL_COMPATIBILITY: dict[BloodGroup, set[BloodGroup]] = {
    BloodGroup.O_NEG:  {BloodGroup.O_NEG},
    BloodGroup.O_POS:  {BloodGroup.O_NEG, BloodGroup.O_POS},
    BloodGroup.A_NEG:  {BloodGroup.O_NEG, BloodGroup.A_NEG},
    BloodGroup.A_POS:  {BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS},
    BloodGroup.B_NEG:  {BloodGroup.O_NEG, BloodGroup.B_NEG},
    BloodGroup.B_POS:  {BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.B_NEG, BloodGroup.B_POS},
    BloodGroup.AB_NEG: {BloodGroup.O_NEG, BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.AB_NEG},
    BloodGroup.AB_POS: {
        BloodGroup.O_NEG, BloodGroup.O_POS,
        BloodGroup.A_NEG, BloodGroup.A_POS,
        BloodGroup.B_NEG, BloodGroup.B_POS,
        BloodGroup.AB_NEG, BloodGroup.AB_POS,
    },
}


def is_compatible(donor_blood_group: BloodGroup, recipient_blood_group: BloodGroup) -> bool:
    """
    Return True if donor can donate red cells to the recipient.
    This is a software aid for prioritising donor outreach only.
    """
    compatible_donors = RED_CELL_COMPATIBILITY.get(recipient_blood_group, set())
    return donor_blood_group in compatible_donors


def get_compatible_donors(recipient_blood_group: BloodGroup) -> list[BloodGroup]:
    """Return list of blood groups compatible with the given recipient."""
    return list(RED_CELL_COMPATIBILITY.get(recipient_blood_group, set()))


def compatibility_score(donor_bg: BloodGroup, recipient_bg: BloodGroup) -> float:
    """
    Return a compatibility score for ranking purposes:
    - 1.0: exact type match (preferred when supply allows)
    - 0.8: compatible universal donor (O-)
    - 0.6: compatible but not same type
    - 0.0: incompatible

    This score is used for donor ranking priority only.
    It is NOT a clinical assessment.
    """
    if not is_compatible(donor_bg, recipient_bg):
        return 0.0
    if donor_bg == recipient_bg:
        return 1.0
    if donor_bg == BloodGroup.O_NEG:
        return 0.8
    return 0.6


# ── String-based compatibility lookups for APIs and UI ────────────────────────
CAN_RECEIVE_FROM_STR: dict[str, list[str]] = {
    "O-": ["O-"],
    "O+": ["O-", "O+"],
    "A-": ["O-", "A-"],
    "A+": ["O-", "O+", "A-", "A+"],
    "B-": ["O-", "B-"],
    "B+": ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
}

CAN_DONATE_TO_STR: dict[str, list[str]] = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
}

UNIVERSAL_DONORS: set[str] = {"O-"}
UNIVERSAL_RECIPIENTS: set[str] = {"AB+"}

