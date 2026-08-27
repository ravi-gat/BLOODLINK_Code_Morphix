import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Building2,
  Droplets,
  Circle,
  CheckCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useAuthStore, getRoleDashboardPath } from "../../stores/useAuthStore";
import { authApi } from "../../services/api";
import type { UserRole, BloodGroup } from "../../types";

const ROLES: { value: Exclude<UserRole, "admin">; label: string; emoji: string; desc: string }[] = [
  { value: "patient", label: "Patient", emoji: "🏥", desc: "Find verified donors & emergency blood" },
  { value: "donor", label: "Donor", emoji: "🩸", desc: "Donate blood & save critical lives" },
  { value: "hospital", label: "Hospital", emoji: "🏨", desc: "Manage clinical & emergency requests" },
  { value: "bloodbank", label: "Blood Bank", emoji: "🧪", desc: "Manage stock & distribution" },
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
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? colors[score] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-muted-foreground">Password strength:</span>
        <span
          className={`text-[11px] font-medium ${
            score >= 3 ? "text-green-600 dark:text-green-400" : score >= 2 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {labels[score]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-[11px]">
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
  const location = useLocation();
  const requestedRole = location.state?.role as UserRole | undefined;
  const [role, setRole] = useState<Exclude<UserRole, "admin">>(
    requestedRole && requestedRole !== "admin" ? (requestedRole as Exclude<UserRole, "admin">) : "patient"
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    hospitalName: "",
    bloodBankName: "",
    registrationNumber: "",
    bloodGroup: "" as BloodGroup | "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);

  const { register, isLoading } = useAuthStore();
const navigate = useNavigate();

const set = (k: keyof typeof form, v: string) => {
  setForm((f) => ({ ...f, [k]: v }));
  setError("");
};

  const isStrongPassword = (value: string) =>
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  const handleNext = () => {
    setError("");
    if (!role || (role as string) === "admin") {
      setError("Please select a valid user role.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { name, email, phone, city, address, password, confirmPassword } = form;

    if (!name.trim() || !email.trim() || !phone.trim() || !city.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^\+?[0-9\s-]{10,15}$/.test(phone.trim())) {
      setError("Enter a valid phone number (10 to 15 digits).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include uppercase, number, and special character.");
      return;
    }

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        hospitalName: role === "hospital" ? form.hospitalName.trim() || name.trim() : undefined,
        bloodBankName: role === "bloodbank" ? form.bloodBankName.trim() || name.trim() : undefined,
        registrationNumber:
          role === "hospital" || role === "bloodbank"
            ? form.registrationNumber.trim() || undefined
            : undefined,
        password,
        confirmPassword,
        role,
        bloodGroup: (role === "patient" || role === "donor") ? (form.bloodGroup as BloodGroup | undefined) : undefined,
      });

      if (result.requiresVerification) {
        setVerificationPending(true);
      } else {
        navigate(getRoleDashboardPath(role));
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your information and try again.");
    }
  };

  const handleResend = async () => {
    if (!form.email.trim()) return;
    setResendingVerification(true);
    try {
      await authApi.resendVerification(form.email.trim());
      setVerificationResent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification link.");
    } finally {
      setResendingVerification(false);
    }
  };

  // Verification Pending Screen
  if (verificationPending) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-5 text-red-600 dark:text-red-400">
          <Mail size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Verify your email</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          We've sent a verification link to{" "}
          <span className="font-semibold text-foreground">{form.email}</span>. Please click the link to activate your BloodLink account.
        </p>

        {verificationResent && (
          <div className="mb-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl p-3 flex items-center justify-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Verification email resent successfully.
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm text-center hover:bg-red-700 transition-colors shadow-sm"
          >
            Proceed to Login
          </Link>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendingVerification}
            className="w-full py-2.5 rounded-xl border border-border text-muted-foreground text-xs hover:bg-muted font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {resendingVerification ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Sending link...
              </>
            ) : (
              <>
                <RefreshCw size={14} /> Resend verification email
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Form Header */}
      <div className="mb-5 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Join verified donors, hospitals, and patients in saving lives.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <CheckCircle size={12} /> : s}
            </div>
            <span
              className={`text-xs font-medium ${
                step >= s ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {s === 1 ? "Select Role" : "Account Details"}
            </span>
            {s < 2 && <div className={`h-px w-8 ${step > s ? "bg-red-500" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 block">
            Select Account Type
          </label>
          <div className="space-y-2 mb-5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                  role === r.value
                    ? "border-red-500 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-500 shadow-2xs"
                    : "border-border bg-card hover:border-red-200 hover:bg-muted/40"
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold ${
                      role === r.value ? "text-red-600 dark:text-red-400" : "text-foreground"
                    }`}
                  >
                    {r.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{r.desc}</div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    role === r.value ? "border-red-500 bg-red-600 text-white" : "border-border"
                  }`}
                >
                  {role === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-xl p-3 mb-4"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            Continue to Details →
          </button>

        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={13} /> Change role ({role.toUpperCase()})
          </button>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              {role === "hospital" ? "Contact Person Full Name" : role === "bloodbank" ? "Manager Full Name" : "Full Name"} *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Dr. Ramesh Gupta"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Email address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Phone number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Bengaluru"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Blood group for patient & donor */}
          {(role === "patient" || role === "donor") && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Blood Group *</label>
              <select
                value={form.bloodGroup}
                onChange={(e) => set("bloodGroup", e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hospital specific fields */}
          {role === "hospital" && (
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Hospital Name *</label>
                <input
                  type="text"
                  value={form.hospitalName}
                  onChange={(e) => set("hospitalName", e.target.value)}
                  placeholder="e.g. Apollo Multi-Speciality Hospital"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Hospital Registration No. *</label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={(e) => set("registrationNumber", e.target.value)}
                  placeholder="e.g. HOSP-KA-2024-9988"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Blood Bank specific fields */}
          {role === "bloodbank" && (
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Blood Bank Name *</label>
                <input
                  type="text"
                  value={form.bloodBankName}
                  onChange={(e) => set("bloodBankName", e.target.value)}
                  placeholder="e.g. Rotary Regional Blood Centre"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">License / Registration No. *</label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={(e) => set("registrationNumber", e.target.value)}
                  placeholder="e.g. BB-LIC-99128"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 12th Main, Indiranagar"
              className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Password *</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min. 8 characters"
                required
                className="w-full px-3.5 py-2 pr-10 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full px-3.5 py-2 pr-10 rounded-xl bg-input-background border border-border text-foreground text-sm focus:ring-2 focus:ring-red-500/30 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-xl p-3"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating account...
              </>
            ) : (
              <>
                <UserPlus size={16} /> Complete Registration
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer link */}
      <p className="text-center text-xs text-muted-foreground mt-5">
        Already have an account?{" "}
        <Link to="/login" className="text-red-600 dark:text-red-400 font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
