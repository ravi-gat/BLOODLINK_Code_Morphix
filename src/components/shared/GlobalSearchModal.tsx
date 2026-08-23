import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  X,
  Droplets,
  Building2,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  TrendingUp,
  Plus,
  Loader2,
} from "lucide-react";
import { searchApi, GlobalSearchResponse } from "../../services/api";
import { useAuthStore } from "../../stores/useAuthStore";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse["data"] | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "blood_group" | "facilities" | "requests" | "donors">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Handle Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await searchApi.globalSearch(
          query.trim(),
          activeTab === "all" ? undefined : activeTab
        );
        setResults(resp.data);
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const hasAnyResults =
    results &&
    (results.blood_group ||
      results.facilities.length > 0 ||
      results.requests.length > 0 ||
      results.donors.length > 0 ||
      results.quick_actions.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-md transition-all animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-muted/20">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blood groups (O+, A-), hospitals, blood banks, requests, or actions..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/70 text-sm focus:outline-none"
          />
          {loading && <Loader2 size={16} className="animate-spin text-red-600 shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-muted/10 overflow-x-auto text-xs">
          {[
            { id: "all", label: "All" },
            { id: "facilities", label: "Facilities" },
            { id: "requests", label: "Requests" },
            { id: "donors", label: "Donors" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-red-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-border">
          {/* Default Quick Actions when query is empty */}
          {!query.trim() && (
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Quick Shortcuts & Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user?.role === "patient" && (
                  <>
                    <button
                      onClick={() => handleNavigate("/patient/emergency")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-red-600 transition-colors">
                          Emergency Blood Request
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Immediate requisition
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigate("/patient/search")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                        <Search size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                          Search Donors & Units
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Filter by blood type & city
                        </div>
                      </div>
                    </button>
                  </>
                )}

                {user?.role === "donor" && (
                  <>
                    <button
                      onClick={() => handleNavigate("/donor/requests")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                        <Droplets size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-red-600 transition-colors">
                          Compatible Requests
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Pending transfusion matches
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigate("/donor/health")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Activity size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                          Health Readiness Check
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Eligibility assessment
                        </div>
                      </div>
                    </button>
                  </>
                )}

                {user?.role === "hospital" && (
                  <>
                    <button
                      onClick={() => handleNavigate("/hospital/emergency")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-red-600 transition-colors">
                          Hospital Requisition
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Broadcast emergency need
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigate("/hospital/inventory")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                        <Droplets size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                          Hospital Inventory
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Manage blood stock
                        </div>
                      </div>
                    </button>
                  </>
                )}

                {user?.role === "bloodbank" && (
                  <>
                    <button
                      onClick={() => handleNavigate("/bloodbank/inventory")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                        <Droplets size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-red-600 transition-colors">
                          Stock Inventory
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Update reserves & units
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigate("/bloodbank/collection")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Plus size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                          Record Blood Collection
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Log verified donations
                        </div>
                      </div>
                    </button>
                  </>
                )}

                {user?.role === "admin" && (
                  <>
                    <button
                      onClick={() => handleNavigate("/admin/users")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                          Manage Users & Roles
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Account verifications
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigate("/admin/analytics")}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                          Live Analytics & Audit Logs
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          System metrics
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* Blood group search chips */}
              <div className="pt-3">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Explore Blood Groups
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setQuery(bg)}
                      className="px-2.5 py-1 rounded-lg border border-border bg-muted/30 text-xs font-bold text-foreground hover:border-red-500 hover:text-red-600 hover:bg-red-500/5 transition-all"
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Blood Group Matched Card */}
          {results?.blood_group && (
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                      {results.blood_group.blood_group}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Blood Type {results.blood_group.blood_group}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {results.blood_group.is_universal_donor && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <ShieldCheck size={11} /> Universal Red-Cell Donor
                          </span>
                        )}
                        {results.blood_group.is_universal_recipient && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                            <ShieldCheck size={11} /> Universal Recipient
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-foreground">
                      {results.blood_group.available_donors_count} Active Donors
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {results.blood_group.available_units_count} Units in Stock
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-red-500/15 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Can Donate To:</span>
                    <span className="font-semibold text-foreground">
                      {results.blood_group.can_donate_to.join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Can Receive From:</span>
                    <span className="font-semibold text-foreground">
                      {results.blood_group.can_receive_from.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Facilities Results */}
          {results && results.facilities.length > 0 && (
            <div className="space-y-2 pt-3">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Facilities ({results.facilities.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.facilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-2.5 rounded-xl border border-border hover:bg-muted/40 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          fac.type === "HOSPITAL"
                            ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600"
                            : "bg-purple-100 dark:bg-purple-950/50 text-purple-600"
                        }`}
                      >
                        <Building2 size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {fac.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
                          <MapPin size={10} />
                          {fac.city} {fac.address ? `• ${fac.address}` : ""}
                        </div>
                      </div>
                    </div>
                    {fac.total_units !== undefined && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-md shrink-0 ml-2">
                        {fac.total_units} units
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requests Results */}
          {results && results.requests.length > 0 && (
            <div className="space-y-2 pt-3">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Requisitions & Requests ({results.requests.length})
              </div>
              <div className="space-y-1.5">
                {results.requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl border border-border hover:bg-muted/40 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {req.blood_group}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {req.units_required} Units • {req.urgency} Urgency
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {req.hospital_name || req.city} • {req.created_at}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        req.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                          : req.status === "ACCEPTED"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donors Results */}
          {results && results.donors.length > 0 && (
            <div className="space-y-2 pt-3">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Donors ({results.donors.length})
              </div>
              <div className="space-y-1.5">
                {results.donors.map((donor) => (
                  <div
                    key={donor.id}
                    className="p-2.5 rounded-xl border border-border hover:bg-muted/40 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Users size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {donor.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} /> {donor.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {donor.blood_group && (
                        <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md text-foreground">
                          {donor.blood_group}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          donor.availability
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {donor.availability ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results state */}
          {query.trim() && !loading && !hasAnyResults && (
            <div className="py-10 text-center text-muted-foreground">
              <Search size={28} className="mx-auto mb-2 opacity-40" />
              <div className="text-xs font-medium">No matching records found</div>
              <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                Try searching for a blood group like "O+", facility name, or city.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Search with <kbd className="font-mono font-semibold">⌘K</kbd> /{" "}
              <kbd className="font-mono font-semibold">Ctrl+K</kbd>
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/70">
            BloodLink Global Directory
          </span>
        </div>
      </div>
    </div>
  );
}
