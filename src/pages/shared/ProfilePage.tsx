import { useState } from "react";
import { Camera, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../components/shared/PageHeader";
import { Avatar } from "../../components/shared/Avatar";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { VerifiedBadge, RoleBadge } from "../../components/shared/StatusBadge";
import { useAuthStore } from "../../stores/useAuthStore";
import { patientApi, donorApi, hospitalApi, bloodBankApi, ApiError } from "../../services/api";
import type { UserRole, BloodGroup } from "../../types";

const BASE_PATH: Record<UserRole, string> = {
  patient: "/patient",
  donor: "/donor",
  hospital: "/hospital",
  bloodbank: "/bloodbank",
  admin: "/admin",
};

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    bloodGroup: user?.bloodGroup ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = user?.role as UserRole;
      if (role === "patient") {
        await patientApi.updateProfile({ city: form.city, blood_group: form.bloodGroup || undefined });
      } else if (role === "donor") {
        await donorApi.updateProfile({ city: form.city, blood_group: form.bloodGroup || undefined });
      } else if (role === "hospital") {
        await hospitalApi.updateProfile({ city: form.city });
      } else if (role === "bloodbank") {
        await bloodBankApi.updateProfile({ city: form.city });
      }
      if (user) {
        const initials = form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        setUser({ ...user, name: form.name, phone: form.phone, city: form.city, bloodGroup: form.bloodGroup as BloodGroup, initials });
      }
      setSaved(true);
      toast.success("Profile updated successfully.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const basePath = user ? BASE_PATH[user.role as UserRole] : "";

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information"
        breadcrumbs={[
          { label: user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) ?? ""), path: `${basePath}/dashboard` },
          { label: "Profile" },
        ]}
      />

      {/* Avatar card */}
      <div className="bg-card rounded-2xl border border-border p-6 flex items-center gap-5">
        <div className="relative">
          <Avatar initials={user?.initials ?? "U"} size="xl" />
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors shadow-md">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <RoleBadge role={user?.role ?? ""} />
            <VerifiedBadge verified={user?.verified ?? false} />
            {user?.bloodGroup && <BloodTypePill type={user.bloodGroup} size="sm" />}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-5">Personal Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-muted-foreground text-sm cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
              />
            </div>

            {(user?.role === "patient" || user?.role === "donor") && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Blood Group</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BLOOD_GROUPS.map((g) => (
                    <button key={g} type="button" onClick={() => setForm(f => ({ ...f, bloodGroup: g }))}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${form.bloodGroup === g ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : "Save Changes"}
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle size={15} /> Saved successfully
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: "Account ID", value: user?.id },
            { label: "Member Since", value: user?.createdAt },
            { label: "Account Status", value: user?.verified ? "Verified" : "Pending Verification" },
            { label: "Role", value: user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) ?? "") },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
