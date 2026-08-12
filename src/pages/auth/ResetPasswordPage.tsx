import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Eye, EyeOff, Loader2, CheckCircle, KeyRound } from "lucide-react";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isStrongPassword = (value: string) => value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) { setError("Please enter a new password."); return; }
    if (!isStrongPassword(password)) { setError("Password must meet every strength requirement shown below."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Password reset!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <Link
          to="/login"
          className="block w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm text-center hover:bg-red-700 transition-colors"
        >
          Sign In →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <KeyRound size={24} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Choose a strong password for your BloodLink account. It should be at least 8 characters long.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
          <div className="relative">
            <input
              id="new-password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              autoFocus
              required
              minLength={8}
              className="w-full px-4 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
            />
            <button type="button" aria-label={showPass ? "Hide password" : "Show password"} onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && password.length < 8 && (
            <p className="text-xs text-red-600 mt-1">At least 8 characters required</p>
          )}
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground mb-1.5 block">Confirm New Password</label>
          <div className="relative">
            <input
              id="confirm-new-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              required
              minLength={8}
              className="w-full px-4 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
            />
            <button type="button" aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirm && password !== confirm && (
            <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Password checks */}
        {password && (
          <div className="bg-muted/50 rounded-xl p-3 grid grid-cols-2 gap-1.5">
            {[
              { label: "8+ characters", pass: password.length >= 8 },
              { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
              { label: "Number", pass: /\d/.test(password) },
              { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1.5 text-xs">
                <CheckCircle size={11} className={c.pass ? "text-green-500" : "text-muted-foreground/40"} />
                <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
              </div>
            ))}
          </div>
        )}

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
          {loading ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
