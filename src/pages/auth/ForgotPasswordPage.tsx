import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          We've sent a 6-digit OTP to{" "}
          <span className="font-semibold text-foreground">{email}</span>. Enter it on the next screen to reset your password.
        </p>
        <button
          onClick={() => navigate("/verify-otp", { state: { email, purpose: "reset" } })}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
        >
          Enter OTP →
        </button>
        <button
          onClick={() => setSent(false)}
          className="mt-3 w-full py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
        >
          Use a different email
        </button>
        <p className="text-xs text-muted-foreground mt-4">
          Didn't receive it? Check spam folder or{" "}
          <button onClick={() => { setSent(false); setEmail(""); }} className="text-red-600 hover:underline">
            resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Mail size={24} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Forgot your password?</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          No worries — enter your email address and we'll send you a one-time password to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Sending OTP...</>
          ) : (
            "Send OTP"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Remember your password?{" "}
        <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
