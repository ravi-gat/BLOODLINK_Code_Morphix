import { useState } from "react";
import { Plus, Search, Download } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { COLLECTION_RECORDS } from "../../data/bloodbanks";
import { EmptyState } from "../../components/shared/EmptyState";

const STATUS_FILTER = ["All", "Available", "Issued", "Quarantine", "Expired"];
const COMPONENT_FILTER = ["All", "Whole Blood", "Platelet", "Plasma", "Packed RBC"];

export function CollectionPage() {
  const [status, setStatus] = useState("All");
  const [component, setComponent] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = COLLECTION_RECORDS.filter((c) => {
    if (status !== "All" && c.status !== status) return false;
    if (component !== "All" && c.component !== component) return false;
    if (search && !c.donorName.toLowerCase().includes(search.toLowerCase()) && !c.bagId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const STATUS_COLOR: Record<string, string> = {
    Available: "#43A047", Issued: "#1565C0", Quarantine: "#F9A825", Expired: "#D32F2F",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Collection"
        subtitle="Incoming donations and collection records"
        breadcrumbs={[{ label: "Blood Bank", path: "/bloodbank/dashboard" }, { label: "Collection" }]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus size={16} /> Record Collection
          </button>
        }
      />

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">New Collection Record</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-sm">✕ Cancel</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Donor Name", placeholder: "Full name" },
              { label: "Bag ID", placeholder: "BG-YYYY-MMDD-XXX" },
              { label: "Volume (ml)", placeholder: "450" },
              { label: "Collected Date", placeholder: "YYYY-MM-DD", type: "date" },
              { label: "Expiry Date", placeholder: "YYYY-MM-DD", type: "date" },
            ].map(({ label, placeholder, type }) => (
              <div key={label}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
                <input type={type ?? "text"} placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Component</label>
              <select className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none text-sm">
                <option>Whole Blood</option><option>Platelet</option><option>Plasma</option><option>Packed RBC</option>
              </select>
            </div>
          </div>
          <button onClick={() => setShowForm(false)} className="mt-4 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
            Save Record
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor or bag ID…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTER.map((f) => (
            <button key={f} onClick={() => setStatus(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${status === f ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {COMPONENT_FILTER.map((f) => (
            <button key={f} onClick={() => setComponent(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${component === f ? "bg-blue-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-blue-300"}`}>
              {f === "All" ? "All Types" : f}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground flex-shrink-0">
          <Download size={15} /> Export
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No records found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Bag ID", "Donor", "Blood Group", "Component", "Volume", "Collected", "Expiry", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const daysLeft = Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{c.bagId}</td>
                      <td className="py-3.5 px-4 font-medium text-foreground">{c.donorName}</td>
                      <td className="py-3.5 px-4"><BloodTypePill type={c.donorBloodGroup} /></td>
                      <td className="py-3.5 px-4 text-muted-foreground">{c.component}</td>
                      <td className="py-3.5 px-4 font-mono text-foreground">{c.volume} ml</td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                        {new Date(c.collectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-orange-500" : "text-muted-foreground"}`}>
                          {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge text={c.status} color={STATUS_COLOR[c.status]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
