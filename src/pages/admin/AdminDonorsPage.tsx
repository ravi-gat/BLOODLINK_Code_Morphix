import { useState } from "react";
import { Search, Download } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { Avatar } from "../../components/shared/Avatar";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { StatusBadge, VerifiedBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { Toggle } from "../../components/shared/Toggle";
import { DONORS } from "../../data/donors";
import { Heart, Activity, CheckCircle, Award } from "lucide-react";
import type { BloodGroup } from "../../types";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function AdminDonorsPage() {
  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState<BloodGroup | "">("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const filtered = DONORS.filter((d) => {
    if (onlyAvailable && !d.available) return false;
    if (onlyVerified && !d.verified) return false;
    if (bloodFilter && d.bloodGroup !== bloodFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !d.city.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donors"
        subtitle="All registered donors on the platform"
        breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Donors" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground">
            <Download size={15} /> Export
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Total Donors" value={String(DONORS.length)} color="#E53935" />
        <StatCard icon={Activity} label="Available Now" value={String(DONORS.filter(d => d.available).length)} color="#43A047" />
        <StatCard icon={CheckCircle} label="Verified" value={String(DONORS.filter(d => d.verified).length)} color="#1565C0" />
        <StatCard icon={Award} label="Avg. Health Score" value="91.5" color="#F9A825" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor name or city…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {BLOOD_GROUPS.map((g) => (
            <button key={g} onClick={() => setBloodFilter(bloodFilter === g ? "" : g)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${bloodFilter === g ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Available</span>
            <Toggle checked={onlyAvailable} onChange={setOnlyAvailable} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Verified</span>
            <Toggle checked={onlyVerified} onChange={setOnlyVerified} size="sm" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Donor", "Blood Group", "City", "Donations", "Health Score", "Status", "Availability", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={d.initials} size="sm" />
                      <div>
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><BloodTypePill type={d.bloodGroup} /></td>
                  <td className="py-3.5 px-4 text-muted-foreground">{d.city}</td>
                  <td className="py-3.5 px-4 font-mono text-foreground">{d.totalDonations}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${d.healthScore}%` }} />
                      </div>
                      <span className="text-xs font-mono text-foreground">{d.healthScore}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><VerifiedBadge verified={d.verified} /></td>
                  <td className="py-3.5 px-4">
                    <StatusBadge text={d.available ? "Available" : "Unavailable"} color={d.available ? "#43A047" : "#6B7280"} dot />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600 hover:underline font-medium">View</button>
                      <button className="text-xs text-red-600 hover:underline font-medium">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
