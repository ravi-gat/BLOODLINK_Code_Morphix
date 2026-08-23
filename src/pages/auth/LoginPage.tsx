import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuthStore, getRoleDashboardPath } from "../../stores/useAuthStore";
import { authApi } from "../../services/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessNotice("");
    setVerificationResent(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) { setError("Please enter your registered email address."); return; }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) { setError("Please enter a valid email address."); return; }
    if (!password) { setError("Please enter your password."); return; }

    try {
      await login(trimmedEmail, password);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role) {
        navigate(getRoleDashboardPath(currentUser.role));
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setResendingVerification(true);
    setError("");
    try {
      await authApi.resendVerification(email.trim());
      setVerificationResent(true);
      setSuccessNotice("A new verification link has been sent to your email. Please check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification link.");
    } finally {
      setResendingVerification(false);
    }
  };

  const isUnverifiedError = error.toLowerCase().includes("verify your email");

  return (
    <div className="w-full">
      {/* Form Header */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Sign in to your BloodLink clinical healthcare account.
        </p>
      </div>

      {/* Success notice */}
      {successNotice && (
        <div role="status" className="mb-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl p-3.5 flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{successNotice}</div>
        </div>
      )}

      {/* Error notice */}
      {error && (
        <div id="login-error" role="alert" className="mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-xs rounded-xl p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{error}</div>
          </div>
          {isUnverifiedError && !verificationResent && (
            <div className="pt-1 pl-6">
              <button type="button" onClick={handleResendVerification} disabled={resendingVerification}
                className="inline-flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-300 hover:underline transition-colors cursor-pointer">
                {resendingVerification
                  ? <><Loader2 size={12} className="animate-spin" /> Sending link...</>
                  : <><RefreshCw size={12} /> Resend verification email</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="text-xs font-semibold text-foreground mb-1.5 block">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Mail size={16} />
            </div>
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" autoComplete="email" required
              aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined}
              data-testid="login-email"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm transition" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-xs font-semibold text-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Lock size={16} />
            </div>
            <input id="login-password" type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
              autoComplete="current-password" required
              aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined}
              data-testid="login-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm transition" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} data-testid="login-submit"
          className="w-full mt-2 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.99] cursor-pointer">
          {isLoading
            ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
            : <><LogIn size={16} /> Sign In</>}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground mt-6 pt-5 border-t border-border/70">
        Don't have an account?{" "}
        <Link to="/register" className="text-red-600 dark:text-red-400 font-bold hover:underline">
          Register now
        </Link>
      </div>
    </div>
  );
}
