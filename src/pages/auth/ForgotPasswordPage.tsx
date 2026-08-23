import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "../../services/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center w-full">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={34} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          If an account exists for <span className="font-semibold text-foreground">{email}</span>, we have dispatched secure password reset instructions to your inbox.
        </p>
        <Link
          to="/login"
          className="block w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm"
        >
          Return to Sign In →
        </Link>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="mt-3 w-full py-2.5 rounded-xl border border-border text-muted-foreground text-xs hover:bg-muted transition-colors cursor-pointer"
        >
          Use a different email address
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Enter your registered email address and we'll send you secure instructions to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoFocus
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending instructions...
            </>
          ) : (
            "Send Reset Instructions"
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Remember your password?{" "}
        <Link to="/login" className="text-red-600 dark:text-red-400 font-bold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
