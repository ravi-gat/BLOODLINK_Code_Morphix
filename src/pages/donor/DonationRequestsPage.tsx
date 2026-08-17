import { useState } from "react";
import { MapPin, Clock, CheckCircle, XCircle, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useApi } from "../../hooks/useApi";
import { donorApi, ApiError } from "../../services/api";

const TABS = ["All", "Active", "Responded", "Declined"];

export function DonationRequestsPage() {
  const [tab, setTab] = useState("All");
  const [responses, setResponses] = useState<Record<string, "accepted" | "declined">>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const { data: requests, isLoading, error, refetch } = useApi(() => donorApi.getRequests());

  const activeRequests = requests?.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED" && r.status !== "EXPIRED"
  ) ?? [];

  const filtered =
    tab === "All" ? activeRequests :
    tab === "Active" ? activeRequests.filter((r) => !responses[r.id]) :
    tab === "Responded" ? activeRequests.filter((r) => responses[r.id] === "accepted") :
    activeRequests.filter((r) => responses[r.id] === "declined");

  const handleAccept = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await donorApi.acceptRequest(requestId);
      setResponses((prev) => ({ ...prev, [requestId]: "accepted" }));
      toast.success("You have accepted this request. Please proceed to the hospital.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to accept request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await donorApi.declineRequest(requestId);
      setResponses((prev) => ({ ...prev, [requestId]: "declined" }));
      toast.info("You have declined this request.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to decline request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Requests"
        subtitle="Emergency blood requests near you that need your help"
        breadcrumbs={[{ label: "Donor", path: "/donor/dashboard" }, { label: "Donation Requests" }]}
      />

      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSkeleton.SkeletonPage />}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button onClick={refetch} className="mt-3 text-sm text-red-600 underline">Try again</button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState icon={CheckCircle} title="No requests here" description="There are no requests matching this filter right now." />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((r) => {
            const responded = responses[r.id];
            const isActing = actionLoading[r.id];
            return (
              <div key={r.id} className={`bg-card rounded-2xl border p-5 transition-all ${
                responded === "accepted" ? "border-green-200 dark:border-green-900/50" :
                responded === "declined" ? "border-muted" : "border-border hover:shadow-md"
              }`}>
                <div className="flex items-start gap-4">
                  <BloodTypePill type={r.blood_group as import("../../types").BloodGroup} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground">{r.hospital_name || r.city}</h3>
                      <UrgencyBadge urgency={r.urgency as import("../../types").UrgencyLevel} />
                      {responded && (
                        <StatusBadge
                          text={responded === "accepted" ? "You Responded" : "Declined"}
                          color={responded === "accepted" ? "#43A047" : "#6B7280"}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><MapPin size={11} />{r.city}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />
                        {new Date(r.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>{r.units_required} unit{r.units_required > 1 ? "s" : ""} needed</span>
                    </div>
                    {r.medical_notes && (
                      <div className="bg-muted/50 rounded-xl px-3 py-2 text-xs text-muted-foreground mb-3">
                        📝 {r.medical_notes}
                      </div>
                    )}

                    {!responded ? (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleAccept(r.id)}
                          disabled={isActing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
                        >
                          {isActing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                          Accept & Respond
                        </button>
                        <button
                          onClick={() => handleDecline(r.id)}
                          disabled={isActing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
                        >
                          <XCircle size={15} /> Decline
                        </button>
                        {r.contact_number && (
                          <a
                            href={`tel:${r.contact_number}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 transition-colors"
                          >
                            <Phone size={15} /> Call Hospital
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className={`text-sm font-medium flex items-center gap-2 ${
                        responded === "accepted" ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        {responded === "accepted" ? (
                          <><CheckCircle size={15} /> You accepted this request. Please proceed to {r.hospital_name || r.city}.</>
                        ) : (
                          <><XCircle size={15} /> You declined this request.</>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <div className="text-2xl font-bold font-mono text-red-600">{r.blood_group}</div>
                    <div className="text-xs text-muted-foreground mt-1">{r.units_required} unit{r.units_required > 1 ? "s" : ""}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
