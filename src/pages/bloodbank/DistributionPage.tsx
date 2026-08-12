import { useState } from "react";
import { Truck, Search, Download, Plus } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { EmptyState } from "../../components/shared/EmptyState";
import { DISTRIBUTION_RECORDS } from "../../data/bloodbanks";
import { CheckCircle, Clock } from "lucide-react";

const STATUS_FILTER = ["All", "Issued", "Delivered", "Returned"];

export function DistributionPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = DISTRIBUTION_RECORDS.filter((d) => {
    if (filter !== "All" && d.status !== filter) return false;
    if (search && !d.hospital.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const STATUS_COLOR: Record<string, string> = { Issued: "#1565C0", Delivered: "#43A047", Returned: "#F9A825" };

  const totalUnitsDistributed = DISTRIBUTION_RECORDS.reduce((s, d) => s + d.units, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribution"
        subtitle="Blood issued to hospitals and distribution tracking"
        breadcrumbs={[{ label: "Blood Bank", path: "/bloodbank/dashboard" }, { label: "Distribution" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            <Plus size={16} /> Issue Blood
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Truck} label="Total Distributed" value={String(totalUnitsDistributed)} delta="units today" color="#1565C0" />
        <StatCard icon={CheckCircle} label="Delivered" value={String(DISTRIBUTION_RECORDS.filter(d => d.status === "Delivered").length)} color="#43A047" />
        <StatCard icon={Clock} label="Pending Delivery" value={String(DISTRIBUTION_RECORDS.filter(d => d.status === "Issued").length)} color="#F9A825" deltaPositive={false} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospital…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTER.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"}`}>
              {f}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted text-foreground">
          <Download size={15} /> Export
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No distribution records" description="No records match your filter." />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Hospital", "Blood Group", "Units", "Component", "Issued By", "Received By", "Date", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground">{d.hospital}</td>
                    <td className="py-3.5 px-4"><BloodTypePill type={d.bloodGroup} /></td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-foreground">{d.units}</td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">{d.component}</td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">{d.issuedBy}</td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">{d.receivedBy}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(d.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge text={d.status} color={STATUS_COLOR[d.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
