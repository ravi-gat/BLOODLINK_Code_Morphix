import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { CheckCircle2, AlertCircle, Loader2, Mail, RefreshCw } from "lucide-react";
import { authApi } from "../../services/api";
import { BloodLinkLogo } from "../../components/shared/BloodLinkLogo";
import { CodeMorphixLogo } from "../../components/shared/CodeMorphixLogo";

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("No verification token found in URL.");
      return;
    }

    let isMounted = true;
    async function verify() {
      try {
        const res = await authApi.verifyEmail(token as string);
        if (isMounted) {
          setSuccess(true);
          setMessage(res.message || "Your email address has been verified successfully!");
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setSuccess(false);
          setMessage(err?.message || "Invalid or expired verification link.");
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendMessage("");
    try {
      const res = await authApi.resendVerification(resendEmail.trim());
      setResendMessage(res.message || "Verification link sent! Please check your inbox.");
    } catch (err: any) {
      setResendMessage(err?.message || "Failed to resend verification link.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full text-center py-6">
      <div className="mb-5 flex justify-center">
        <BloodLinkLogo size="md" />
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto text-red-600">
            <Loader2 size={32} className="animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Verifying your email...</h1>
          <p className="text-muted-foreground text-xs">
            Please wait while we confirm your healthcare credentials.
          </p>
        </div>
      ) : success ? (
        <div className="space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Email Verified!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm"
            >
              Sign In to Your Account →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <AlertCircle size={34} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            {message}
          </p>

          {/* Resend Form */}
          <div className="p-4 rounded-xl border border-border bg-card text-left space-y-3 mt-4">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail size={14} className="text-red-600" /> Resend verification email
            </div>
            <form onSubmit={handleResend} className="space-y-2.5">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-input-background border border-border text-foreground text-xs focus:ring-2 focus:ring-red-500/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={resending}
                className="w-full py-2 rounded-xl bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {resending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} /> Send New Link
                  </>
                )}
              </button>
            </form>
            {resendMessage && (
              <p className="text-[11px] text-muted-foreground pt-1">{resendMessage}</p>
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}

      {/* Powered by Code Morphix Branding */}
      <div className="mt-8 pt-4 flex justify-center">
        <CodeMorphixLogo size="sm" />
      </div>
    </div>
  );
}
