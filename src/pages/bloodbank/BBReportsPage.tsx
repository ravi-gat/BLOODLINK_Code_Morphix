import React, { useMemo } from "react";
import { FileText, Download, TrendingUp, CheckCircle, Package, Droplets, AlertTriangle } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useApi } from "../../hooks/useApi";
import { bloodBankApi } from "../../services/api";

export function BBReportsPage() {
  const { data: reportsResp, isLoading: repLoading } = useApi(() => bloodBankApi.getReports());
  const { data: inventory, isLoading: invLoading } = useApi(() => bloodBankApi.getInventory());

  const reports = (reportsResp as { data?: {
    total_units: number;
    inventory_by_type: { blood_group: string; units: number; expiry_date: string }[];
    expiring_soon_count: number;
    expired_count: number;
    expiring_items: { id: string; blood_group: string; units: number; expiry_date: string }[];
  } } | null)?.data;

  const totalUnits = reports?.total_units ?? inventory?.reduce((s, i) => s + i.units_available, 0) ?? 0;
  const expiringSoonCount = reports?.expiring_soon_count ?? 0;
  const expiredCount = reports?.expired_count ?? 0;

  // Chart data by blood group
  const stockByGroup = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    return inventory.map((i) => ({
      blood_group: i.blood_group,
      available: i.units_available,
      reserved: (i as any).units_reserved || 0,
    }));
  }, [inventory]);

  if (repLoading && invLoading) {
    return <LoadingSkeleton.SkeletonPage />;
  }

  const handleExportCSV = () => {
    if (!inventory || inventory.length === 0) return;
    const header = "Blood Group,Units Available,Expiry Date,Last Updated\n";
    const rows = inventory.map((i) => `"${i.blood_group}",${i.units_available},"${i.expiry_date || 'N/A'}","${i.updated_at || ''}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BloodBank_Inventory_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Stock Audit"
        subtitle="Live inventory audit, expiry analysis, and resource reporting"
        breadcrumbs={[{ label: "Blood Bank", path: "/bloodbank/dashboard" }, { label: "Reports" }]}
        actions={
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="Total Blood Units" value={String(totalUnits)} color="#E53935" />
        <StatCard icon={Package} label="Blood Types Stocked" value={String(inventory?.length ?? 0)} color="#1565C0" />
        <StatCard icon={AlertTriangle} label="Expiring in ≤ 7 Days" value={String(expiringSoonCount)} color="#F9A825" deltaPositive={false} />
        <StatCard icon={CheckCircle} label="Expired Units" value={String(expiredCount)} color={expiredCount > 0 ? "#D32F2F" : "#43A047"} deltaPositive={expiredCount === 0} />
      </div>

      {/* Stock distribution bar chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Stock Breakdown by Blood Group</h3>
        {stockByGroup.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No stock records found.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stockByGroup} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="blood_group" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Legend />
              <Bar dataKey="available" fill="#E53935" radius={[4, 4, 0, 0]} name="Units Available" />
              <Bar dataKey="reserved" fill="#43A047" radius={[4, 4, 0, 0]} name="Units Reserved" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Inventory audit table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Stock Inventory Audit</h3>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-colors font-medium"
          >
            <Download size={13} /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Blood Group", "Units Available", "Component Type", "Expiry Date", "Stock Status"].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!inventory || inventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No blood units in inventory.
                  </td>
                </tr>
              ) : (
                inventory.map((row) => {
                  const status = row.units_available >= 15 ? "Normal" : row.units_available >= 5 ? "Low" : "Critical";
                  const color = status === "Normal" ? "#43A047" : status === "Low" ? "#F9A825" : "#D32F2F";
                  return (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-foreground">{row.blood_group}</td>
                      <td className="py-3.5 px-5 font-mono text-foreground">{row.units_available} units</td>
                      <td className="py-3.5 px-5 text-muted-foreground">{row.component_type || "Whole Blood"}</td>
                      <td className="py-3.5 px-5 text-muted-foreground">{row.expiry_date || "—"}</td>
                      <td className="py-3.5 px-5">
                        <StatusBadge text={status} color={color} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
