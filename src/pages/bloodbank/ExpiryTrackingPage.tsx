import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { COLLECTION_RECORDS } from "../../data/bloodbanks";

function getDaysLeft(expiryDate: string) {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
}

export function ExpiryTrackingPage() {
  const available = COLLECTION_RECORDS.filter((c) => c.status === "Available");
  const expiredBags = available.filter((c) => getDaysLeft(c.expiryDate) <= 0);
  const criticalBags = available.filter((c) => getDaysLeft(c.expiryDate) > 0 && getDaysLeft(c.expiryDate) <= 3);
  const warningBags = available.filter((c) => getDaysLeft(c.expiryDate) > 3 && getDaysLeft(c.expiryDate) <= 7);
  const safeBags = available.filter((c) => getDaysLeft(c.expiryDate) > 7);

  const groups = [
    { label: "Expired", bags: expiredBags, color: "#D32F2F", bg: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50" },
    { label: "Expiring within 3 days", bags: criticalBags, color: "#F9A825", bg: "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50" },
    { label: "Expiring within 7 days", bags: warningBags, color: "#1565C0", bg: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50" },
    { label: "Safe (7+ days)", bags: safeBags, color: "#43A047", bg: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expiry Tracking"
        subtitle="Monitor blood bag shelf life and prevent wastage"
        breadcrumbs={[{ label: "Blood Bank", path: "/bloodbank/dashboard" }, { label: "Expiry Tracking" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Expired" value={String(expiredBags.length)} color="#D32F2F" deltaPositive={false} />
        <StatCard icon={Clock} label="Critical (≤3 days)" value={String(criticalBags.length)} color="#F9A825" deltaPositive={false} />
        <StatCard icon={Clock} label="Warning (≤7 days)" value={String(warningBags.length)} color="#1565C0" />
        <StatCard icon={CheckCircle} label="Safe" value={String(safeBags.length)} color="#43A047" />
      </div>

      {groups.map(({ label, bags, color, bg }) => bags.length > 0 && (
        <div key={label} className={`rounded-2xl border p-6 ${bg}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <h3 className="font-semibold text-foreground">{label}</h3>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + "20", color }}>
              {bags.length} bag{bags.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Bag ID", "Donor", "Blood Group", "Component", "Expiry Date", "Days Left", "Action"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bags.map((c) => {
                  const days = getDaysLeft(c.expiryDate);
                  return (
                    <tr key={c.id} className="border-b border-border/30 last:border-0 hover:bg-white/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{c.bagId}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{c.donorName}</td>
                      <td className="py-2.5 px-3"><BloodTypePill type={c.donorBloodGroup} /></td>
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">{c.component}</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{c.expiryDate}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-sm" style={{ color }}>
                          {days <= 0 ? "Expired" : `${days}d`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {days <= 0 ? (
                          <button className="text-xs text-red-600 hover:underline font-medium">Mark Disposed</button>
                        ) : (
                          <button className="text-xs text-blue-600 hover:underline font-medium">Issue Now</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
