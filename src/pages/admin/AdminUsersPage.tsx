import { useState } from "react";
import { Search, UserPlus, Filter, Download } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { Avatar } from "../../components/shared/Avatar";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { RoleBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { Users, Heart, Building2, Droplets } from "lucide-react";

const ALL_USERS = [
  { id: "u001", name: "Priya Sharma", role: "donor", blood: "A+", city: "Mumbai", joined: "Aug 4, 2024", status: "Verified", email: "priya@example.com" },
  { id: "u002", name: "Amit Verma", role: "patient", blood: "B+", city: "Pune", joined: "Aug 4, 2024", status: "Pending", email: "amit@example.com" },
  { id: "u003", name: "Dr. Neha Gupta", role: "hospital", blood: "", city: "Hyderabad", joined: "Aug 3, 2024", status: "Verified", email: "neha@aiims.edu" },
  { id: "u004", name: "Ravi Shankar", role: "donor", blood: "O-", city: "Chennai", joined: "Aug 3, 2024", status: "Verified", email: "ravi@gmail.com" },
  { id: "u005", name: "Sneha Pillai", role: "bloodbank", blood: "", city: "Bengaluru", joined: "Aug 2, 2024", status: "Under Review", email: "sneha@bb.org" },
  { id: "u006", name: "Kunal Joshi", role: "donor", blood: "AB+", city: "Delhi", joined: "Aug 2, 2024", status: "Verified", email: "kunal@gmail.com" },
  { id: "u007", name: "Arjun Mehta", role: "donor", blood: "O+", city: "New Delhi", joined: "Jan 15, 2022", status: "Verified", email: "arjun@gmail.com" },
  { id: "u008", name: "Kavitha Nambiar", role: "patient", blood: "O+", city: "Kochi", joined: "Mar 12, 2023", status: "Verified", email: "kavitha@gmail.com" },
  { id: "u009", name: "Vikram Nair", role: "donor", blood: "O-", city: "Chennai", joined: "Feb 14, 2020", status: "Verified", email: "vikram@gmail.com" },
  { id: "u010", name: "Deepa Reddy", role: "donor", blood: "A-", city: "Hyderabad", joined: "Aug 20, 2022", status: "Verified", email: "deepa@gmail.com" },
];

const ROLE_FILTER = ["All", "donor", "patient", "hospital", "bloodbank", "admin"];
const STATUS_FILTER = ["All", "Verified", "Pending", "Under Review"];
const STATUS_COLOR: Record<string, string> = { Verified: "#43A047", Pending: "#F9A825", "Under Review": "#1565C0" };

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = ALL_USERS.filter((u) => {
    if (roleFilter !== "All" && u.role !== roleFilter) return false;
    if (statusFilter !== "All" && u.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.city.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage all registered users across roles"
        breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Users" }]}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground">
              <Download size={15} /> Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
              <UserPlus size={16} /> Add User
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={String(ALL_USERS.length)} color="#E53935" />
        <StatCard icon={Heart} label="Donors" value={String(ALL_USERS.filter(u => u.role === "donor").length)} color="#43A047" />
        <StatCard icon={Building2} label="Hospitals" value={String(ALL_USERS.filter(u => u.role === "hospital").length)} color="#1565C0" />
        <StatCard icon={Droplets} label="Blood Banks" value={String(ALL_USERS.filter(u => u.role === "bloodbank").length)} color="#F9A825" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, city…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <Filter size={14} className="text-muted-foreground" />
          {ROLE_FILTER.map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${roleFilter === r ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTER.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-blue-300"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {ALL_USERS.length} users
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["User", "Role", "Blood Type", "City", "Joined", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} size="sm" />
                      <div>
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><RoleBadge role={u.role} /></td>
                  <td className="py-3.5 px-4">{u.blood ? <BloodTypePill type={u.blood} /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{u.city}</td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">{u.joined}</td>
                  <td className="py-3.5 px-4"><StatusBadge text={u.status} color={STATUS_COLOR[u.status] ?? "#6B7280"} /></td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-2">
                      <button className="px-2.5 py-1 rounded-lg text-xs text-blue-600 hover:underline font-medium">Edit</button>
                      {u.status === "Pending" && <button className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">Verify</button>}
                      <button className="px-2.5 py-1 rounded-lg text-xs text-red-600 hover:underline font-medium">Suspend</button>
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
