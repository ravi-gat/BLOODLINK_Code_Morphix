import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Loader2, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

export function OTPVerificationPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string; purpose?: string })?.email ?? "your@email.com";
  const purpose = (location.state as { purpose?: string })?.purpose ?? "reset";

  // Countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((c, i) => { if (i < 6) next[i] = c; });
    setOtp(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    // Mock: any 6 digits work
    navigate("/reset-password", { state: { email, code } });
  };

  const handleResend = async () => {
    setResending(true);
    await new Promise((res) => setTimeout(res, 800));
    setResending(false);
    setResendTimer(30);
    setOtp(["", "", "", "", "", ""]);
    refs.current[0]?.focus();
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <ShieldCheck size={24} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Verify your identity</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          We sent a 6-digit OTP to{" "}
          <span className="font-semibold text-foreground">{email}</span>. Enter it below to continue.
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex gap-2.5 justify-between mb-6" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none
              ${digit
                ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 ring-1 ring-red-500"
                : "border-border bg-input-background text-foreground"
              }
              focus:ring-2 focus:ring-red-500/30 focus:border-red-500`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-muted/50 rounded-xl px-4 py-3 text-xs text-muted-foreground mb-4">
        <span className="font-semibold">Demo:</span> Enter any 6-digit code to proceed (e.g. <span className="font-mono font-semibold">123456</span>)
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || otp.join("").length < 6}
        className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Verify OTP"}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 text-sm">
        <span className="text-muted-foreground">Didn't receive it?</span>
        {resendTimer > 0 ? (
          <span className="text-muted-foreground">Resend in <span className="font-mono font-semibold text-foreground">{resendTimer}s</span></span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-red-600 font-semibold hover:underline flex items-center gap-1"
          >
            {resending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}
