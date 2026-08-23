import { useState } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router";
import { Eye, EyeOff, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { authApi } from "../../services/api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get("token") || (location.state as { token?: string })?.token || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const isStrongPassword = (value: string) =>
    value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Password reset token is missing. Please request a new reset link from the login page.");
      return;
    }
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must meet every strength requirement shown below.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Your reset link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center w-full">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={34} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Password reset successful!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Your password has been updated securely. You can now sign in to your BloodLink account.
        </p>
        <Link
          to="/login"
          className="block w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm text-center hover:bg-red-700 transition-colors shadow-sm"
        >
          Sign In Now →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
          <KeyRound size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Create a secure password for your BloodLink healthcare account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="text-xs font-semibold text-foreground mb-1.5 block">
            New Password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoFocus
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm"
            />
            <button
              type="button"
              aria-label={showPass ? "Hide password" : "Show password"}
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="text-xs font-semibold text-foreground mb-1.5 block">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirm-new-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm"
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Strength Checklist */}
        {password && (
          <div className="bg-muted/40 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "8+ characters", pass: password.length >= 8 },
              { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
              { label: "Number", pass: /\d/.test(password) },
              { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1.5">
                <CheckCircle2
                  size={13}
                  className={c.pass ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40"}
                />
                <span className={c.pass ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        )}

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
              <Loader2 size={16} className="animate-spin" /> Updating password...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground mt-5">
        Remember your password?{" "}
        <Link to="/login" className="text-red-600 dark:text-red-400 font-bold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
