import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, CheckCircle, Circle } from "lucide-react";
import { useAuthStore, getRoleDashboardPath } from "../../stores/useAuthStore";
import type { UserRole, BloodGroup } from "../../types";

const ROLES: { value: UserRole; label: string; emoji: string; desc: string }[] = [
  { value: "patient", label: "Patient", emoji: "🏥", desc: "I need blood / for a family member" },
  { value: "donor", label: "Donor", emoji: "🩸", desc: "I want to donate blood" },
  { value: "hospital", label: "Hospital", emoji: "🏨", desc: "Register our hospital" },
  { value: "bloodbank", label: "Blood Bank", emoji: "🧪", desc: "Register our blood bank" },
  { value: "admin", label: "Admin", emoji: "⚙️", desc: "Platform administration" },
];

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "One number", pass: /\d/.test(password) },
    { label: "One special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-muted", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">Password strength:</span>
        <span className={`text-xs font-medium ${score >= 3 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-600"}`}>
          {labels[score]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.pass ? (
              <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
            ) : (
              <Circle size={11} className="text-muted-foreground flex-shrink-0" />
            )}
            <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>("patient");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", city: "",
    bloodGroup: "" as BloodGroup | "",
    password: "", confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isStrongPassword = (value: string) => value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

  const handleNext = () => {
    setError("");
    if (!role) { setError("Please select a role."); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { name, email, phone, city, password, confirmPassword } = form;
    if (!name.trim() || !email.trim() || !phone.trim() || !city.trim() || !password) {
      setError("Please fill in all required fields."); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Enter a valid email address."); return; }
    if (!/^\+?[0-9\s-]{10,15}$/.test(phone)) { setError("Enter a valid phone number (10 to 15 digits)."); return; }
    if (password !== confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must meet every strength requirement shown below."); return;
    }
    await register({
      name, email, phone, city, password, confirmPassword, role,
      bloodGroup: form.bloodGroup as BloodGroup | undefined,
    });
    navigate(getRoleDashboardPath(role));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="text-muted-foreground mt-1 text-sm">Join 1,24,850 donors & patients on BloodLink</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= s ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <CheckCircle size={14} /> : s}
            </div>
            <span className={`text-xs font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
              {s === 1 ? "Select Role" : "Your Details"}
            </span>
            {s < 2 && <div className={`flex-1 h-px w-8 ${step > s ? "bg-red-500" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
            I am registering as
          </label>
          <div className="space-y-2 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  role === r.value
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500"
                    : "border-border bg-card hover:border-red-200"
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <div className={`font-semibold text-sm ${role === r.value ? "text-red-600" : "text-foreground"}`}>
                    {r.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  role === r.value ? "border-red-600 bg-red-600" : "border-muted-foreground"
                }`}>
                  {role === r.value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Arjun Mehta"
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone *</label>
              <input
                type="tel"
                required
                minLength={10}
                maxLength={16}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="New Delhi"
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
              />
            </div>

            {(role === "patient" || role === "donor") && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Blood Group</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {BLOOD_GROUPS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("bloodGroup", g)}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        form.bloodGroup === g
                          ? "bg-red-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
              <div className="relative">
                <input
                type={showPass ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
                />
                <button type="button" aria-label={showPass ? "Hide password" : "Show password"} onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password *</label>
              <div className="relative">
                <input
                type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
                />
                <button type="button" aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
