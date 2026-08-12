import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Droplets, Loader2 } from "lucide-react";
import { useAuthStore, getRoleDashboardPath, DEMO_CREDENTIALS } from "../../stores/useAuthStore";
import type { UserRole } from "../../types";

const ROLES: { value: UserRole; label: string; emoji: string; desc: string }[] = [
  { value: "patient", label: "Patient", emoji: "🏥", desc: "Find blood donors" },
  { value: "donor", label: "Donor", emoji: "🩸", desc: "Donate & save lives" },
  { value: "hospital", label: "Hospital", emoji: "🏨", desc: "Manage blood requests" },
  { value: "bloodbank", label: "Blood Bank", emoji: "🧪", desc: "Manage inventory" },
  { value: "admin", label: "Admin", emoji: "⚙️", desc: "Platform control" },
];

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("patient");
  const [error, setError] = useState("");

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Enter your email address."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Enter a valid email address."); return; }
    if (!password) { setError("Enter your password."); return; }
    try {
      await login(email, password, role);
      navigate(getRoleDashboardPath(role));
    } catch {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to your BloodLink account</p>
      </div>

      {/* Role selector */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 block">
          Sign in as
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center ${
                role === r.value
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500"
                  : "border-border bg-card hover:border-red-200 hover:bg-red-50/50"
              }`}
            >
              <span className="text-lg leading-none">{r.emoji}</span>
              <span className={`text-xs font-medium leading-tight ${role === r.value ? "text-red-600" : "text-foreground"}`}>
                {r.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Logging in as <span className="font-medium text-foreground">{ROLES.find(r => r.value === role)?.label}</span> — {ROLES.find(r => r.value === role)?.desc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="text-sm font-medium text-foreground mb-1.5 block">Email address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            data-testid="login-email"
            className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs text-red-600 hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              minLength={8}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              data-testid="login-password"
              className="w-full px-4 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div id="login-error" role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-xl px-4 py-2.5">
          <span className="font-semibold">Demo credentials:</span> {DEMO_CREDENTIALS[role].email} (password available in the developer verification report).
        </div>

        <button
          type="submit"
          disabled={isLoading}
          data-testid="login-submit"
          className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" /> Signing in...</>
          ) : (
            <><Droplets size={16} /> Sign In to BloodLink</>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link to="/register" className="text-red-600 font-semibold hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
