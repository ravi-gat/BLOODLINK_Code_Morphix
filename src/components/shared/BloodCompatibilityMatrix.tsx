import { useState } from "react";
import { Droplets, ArrowRight, ShieldCheck, Info } from "lucide-react";
import type { BloodGroup } from "../../types";

const ALL_BLOOD_GROUPS: BloodGroup[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const COMPATIBILITY_MAP: Record<
  BloodGroup,
  {
    canDonateTo: BloodGroup[];
    canReceiveFrom: BloodGroup[];
    tag: string;
    description: string;
  }
> = {
  "O-": {
    canDonateTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    canReceiveFrom: ["O-"],
    tag: "Universal Red Cell Donor",
    description: "Crucial for emergency trauma resuscitation and neonatal transfusions.",
  },
  "O+": {
    canDonateTo: ["O+", "A+", "B+", "AB+"],
    canReceiveFrom: ["O+", "O-"],
    tag: "Most Common Blood Type",
    description: "Highest demand type in hospitals worldwide for routine surgeries and emergencies.",
  },
  "A-": {
    canDonateTo: ["A-", "A+", "AB-", "AB+"],
    canReceiveFrom: ["A-", "O-"],
    tag: "Rare Negative Group",
    description: "Vital for matching Rh-negative patients requiring targeted platelet and red cells.",
  },
  "A+": {
    canDonateTo: ["A+", "AB+"],
    canReceiveFrom: ["A+", "A-", "O+", "O-"],
    tag: "High Demand Platelet Donor",
    description: "Widely used in cancer therapies and scheduled clinical transfusions.",
  },
  "B-": {
    canDonateTo: ["B-", "B+", "AB-", "AB+"],
    canReceiveFrom: ["B-", "O-"],
    tag: "High Priority Rare Group",
    description: "Essential for managing rare hemoglobinopathies and emergency transfusions.",
  },
  "B+": {
    canDonateTo: ["B+", "AB+"],
    canReceiveFrom: ["B+", "B-", "O+", "O-"],
    tag: "Frequent Critical Group",
    description: "Highly valuable for ongoing sickle-cell and thalassemia treatment programs.",
  },
  "AB-": {
    canDonateTo: ["AB-", "AB+"],
    canReceiveFrom: ["AB-", "A-", "B-", "O-"],
    tag: "Rarest Blood Type (<1%)",
    description: "Universal plasma donor — plasma can be safely given to all other blood types.",
  },
  "AB+": {
    canDonateTo: ["AB+"],
    canReceiveFrom: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    tag: "Universal Red Cell Receiver",
    description: "Can safely accept red blood cell units from any donor of any blood group.",
  },
};

interface Props {
  className?: string;
  initialSelected?: BloodGroup;
  onSelectGroup?: (group: BloodGroup) => void;
}

export function BloodCompatibilityMatrix({
  className = "",
  initialSelected = "O-",
  onSelectGroup,
}: Props) {
  const [selected, setSelected] = useState<BloodGroup>(initialSelected);

  const info = COMPATIBILITY_MAP[selected];

  const handleSelect = (bg: BloodGroup) => {
    setSelected(bg);
    if (onSelectGroup) onSelectGroup(bg);
  };

  return (
    <div className={`bg-card rounded-2xl border border-border p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600">
              <Droplets size={18} />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Blood Type Compatibility Explorer
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Click any blood group to visualize clinical donation & transfusion matching rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            Selected: <span className="font-bold text-red-600 dark:text-red-400">{selected}</span>
          </span>
        </div>
      </div>

      {/* Blood Group Selector Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {ALL_BLOOD_GROUPS.map((bg) => {
          const isSelected = selected === bg;
          const isUniversalDonor = bg === "O-";
          const isUniversalReceiver = bg === "AB+";

          return (
            <button
              key={bg}
              type="button"
              onClick={() => handleSelect(bg)}
              className={`relative py-3 px-2 rounded-xl text-center font-bold text-sm transition-all cursor-pointer border ${
                isSelected
                  ? "bg-red-600 text-white border-red-600 shadow-md scale-105 ring-2 ring-red-500/30 z-10"
                  : "bg-background text-foreground border-border hover:border-red-300 hover:bg-muted/50"
              }`}
            >
              <div className="text-base font-extrabold">{bg}</div>
              {isUniversalDonor && (
                <div className={`text-[9px] font-normal leading-tight mt-0.5 ${isSelected ? "text-red-100" : "text-red-600 dark:text-red-400"}`}>
                  Univ. Donor
                </div>
              )}
              {isUniversalReceiver && (
                <div className={`text-[9px] font-normal leading-tight mt-0.5 ${isSelected ? "text-blue-100" : "text-blue-600 dark:text-blue-400"}`}>
                  Univ. Recv
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Analysis Details Panel */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Can Donate To */}
        <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h4 className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wider">
              {selected} Can Donate Red Cells To ({info.canDonateTo.length} groups)
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_BLOOD_GROUPS.map((bg) => {
              const compatible = info.canDonateTo.includes(bg);
              return (
                <div
                  key={bg}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    compatible
                      ? "bg-red-600 text-white shadow-2xs"
                      : "bg-muted/70 text-muted-foreground opacity-40 line-through"
                  }`}
                >
                  {bg}
                </div>
              );
            })}
          </div>
        </div>

        {/* Can Receive From */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
              {selected} Can Receive Red Cells From ({info.canReceiveFrom.length} groups)
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_BLOOD_GROUPS.map((bg) => {
              const compatible = info.canReceiveFrom.includes(bg);
              return (
                <div
                  key={bg}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    compatible
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-muted/70 text-muted-foreground opacity-40 line-through"
                  }`}
                >
                  {bg}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clinical Notes Footer */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground">
        <Info size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-foreground">{info.tag}: </span>
          {info.description}
        </div>
      </div>
    </div>
  );
}
