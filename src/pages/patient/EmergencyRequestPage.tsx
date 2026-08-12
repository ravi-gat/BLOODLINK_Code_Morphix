import { useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, CheckCircle, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import type { BloodGroup } from "../../types";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STEPS = ["Patient Info", "Medical Details", "Contact", "Review"];

interface FormData {
  patientName: string; age: string; bloodGroup: BloodGroup | "";
  units: string; urgency: string;
  hospital: string; city: string; ward: string;
  doctor: string; diagnosis: string; notes: string;
  contactName: string; contactPhone: string; contactRelation: string;
}

const INITIAL: FormData = {
  patientName: "", age: "", bloodGroup: "",
  units: "1", urgency: "High",
  hospital: "", city: "New Delhi", ward: "",
  doctor: "", diagnosis: "", notes: "",
  contactName: "", contactPhone: "", contactRelation: "Self",
};

export function EmergencyRequestPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const set = (k: keyof FormData, v: string) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const validateStep = () => {
    if (step === 0) {
      if (!form.patientName.trim()) return "Enter the patient's full name.";
      if (!form.bloodGroup) return "Select a blood group.";
      if (form.age && (!/^\d+$/.test(form.age) || Number(form.age) < 0 || Number(form.age) > 120)) return "Age must be a whole number from 0 to 120.";
      if (!/^\d+$/.test(form.units) || Number(form.units) < 1 || Number(form.units) > 10) return "Units required must be a whole number from 1 to 10.";
    }
    if (step === 1 && (!form.hospital.trim() || !form.city.trim())) return "Enter both hospital name and city.";
    if (step === 2) {
      if (!form.contactName.trim()) return "Enter a contact person name.";
      if (!/^\+?[0-9\s-]{10,15}$/.test(form.contactPhone.trim())) return "Enter a valid contact phone number (10 to 15 digits).";
    }
    return "";
  };
  const handleNext = () => { const validationError = validateStep(); if (validationError) { setError(validationError); return; } if (step < STEPS.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = async () => {
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Your emergency blood request has been submitted. Our AI is now matching compatible donors near{" "}
          <strong className="text-foreground">{form.hospital || form.city}</strong>. You will receive notifications as donors respond.
        </p>
        <div className="bg-card rounded-2xl border border-border p-5 text-left mb-6 space-y-2">
          {[
            { label: "Patient", value: form.patientName },
            { label: "Blood Group", value: form.bloodGroup },
            { label: "Units Required", value: form.units },
            { label: "Urgency", value: form.urgency },
            { label: "Hospital", value: form.hospital },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value || "—"}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">Request ID</div>
            <div className="font-mono text-sm font-semibold text-red-600">
              REQ-{Date.now().toString().slice(-8)}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/patient/history")} className="flex-1 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
            View History
          </button>
          <button onClick={() => { setSubmitted(false); setForm(INITIAL); setStep(0); }} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
            New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Emergency Blood Request"
        subtitle="Fill in the details — our AI will match donors instantly"
        breadcrumbs={[{ label: "Patient", path: "/patient/dashboard" }, { label: "Emergency Request" }]}
      />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-red-600 text-white ring-4 ring-red-100 dark:ring-red-900/30" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-green-500" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Patient Name *</label>
                <input required maxLength={80} value={form.patientName} onChange={(e) => set("patientName", e.target.value)} placeholder="Full name" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Age</label>
                <input type="number" min={0} max={120} inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="Years" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Units Required *</label>
                <input type="number" required min={1} max={10} inputMode="numeric" value={form.units} onChange={(e) => set("units", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Blood Group *</label>
              <div className="grid grid-cols-8 gap-1.5">
                {BLOOD_GROUPS.map((g) => (
                  <button key={g} type="button" onClick={() => set("bloodGroup", g)}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors ${form.bloodGroup === g ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Urgency Level *</label>
              <div className="grid grid-cols-4 gap-2">
                {["Critical", "High", "Moderate", "Low"].map((u) => {
                  const colors: Record<string, string> = { Critical: "border-red-500 bg-red-50 text-red-700", High: "border-orange-400 bg-orange-50 text-orange-700", Moderate: "border-blue-400 bg-blue-50 text-blue-700", Low: "border-green-400 bg-green-50 text-green-700" };
                  return (
                    <button key={u} type="button" onClick={() => set("urgency", u)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors ${form.urgency === u ? colors[u] : "border-border bg-card text-muted-foreground hover:border-muted-foreground"}`}>
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Medical & Hospital Details</h3>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Hospital Name *</label>
                <input required maxLength={100} value={form.hospital} onChange={(e) => set("hospital", e.target.value)} placeholder="e.g. AIIMS New Delhi" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">City *</label>
                <input required maxLength={60} value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Ward / Room</label>
                <input value={form.ward} onChange={(e) => set("ward", e.target.value)} placeholder="e.g. ICU Ward 3" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Attending Doctor</label>
              <input value={form.doctor} onChange={(e) => set("doctor", e.target.value)} placeholder="Dr. Name" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Diagnosis / Reason</label>
              <input value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} placeholder="e.g. Road accident, Surgery" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any special requirements or notes..." className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm resize-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Person Name *</label>
              <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Who to call" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Phone *</label>
              <input type="tel" required minLength={10} maxLength={16} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+91 98765 43210" className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Relationship to Patient</label>
              <div className="grid grid-cols-3 gap-2">
                {["Self", "Family", "Friend", "Doctor", "Hospital", "Other"].map((r) => (
                  <button key={r} type="button" onClick={() => set("contactRelation", r)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${form.contactRelation === r ? "border-red-500 bg-red-50 text-red-700" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground mb-2">Review & Submit</h3>
            <p className="text-sm text-muted-foreground mb-4">Please review your request before submitting. Our AI will immediately start matching donors.</p>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              {[
                { label: "Patient Name", value: form.patientName },
                { label: "Blood Group", value: form.bloodGroup },
                { label: "Units Required", value: `${form.units} unit(s)` },
                { label: "Urgency", value: form.urgency },
                { label: "Hospital", value: form.hospital },
                { label: "City", value: form.city },
                { label: "Doctor", value: form.doctor },
                { label: "Diagnosis", value: form.diagnosis },
                { label: "Contact Phone", value: form.contactPhone },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ) : null)}
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <div className="font-semibold mb-0.5">Emergency Request</div>
                By submitting, you confirm this is a genuine medical emergency. False requests violate our terms of service.
              </div>
            </div>
          </div>
        )}

        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-border">
          {step > 0 && (
            <button onClick={handleBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button data-testid="blood-request-submit" onClick={handleSubmit} disabled={loading} className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : <><AlertTriangle size={16} />Submit Emergency Request</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
