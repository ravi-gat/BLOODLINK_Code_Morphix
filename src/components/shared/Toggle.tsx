interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Toggle({ checked, onChange, size = "md", disabled = false }: ToggleProps) {
  const track = size === "sm" ? "w-10 h-5" : "w-11 h-6";
  const thumb = size === "sm" ? "w-4 h-4 top-0.5 left-0.5" : "w-5 h-5 top-0.5 left-0.5";
  const translate = size === "sm" ? "translate-x-5" : "translate-x-5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative ${track} rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-green-500" : "bg-muted-foreground"}`}
    >
      <span
        className={`absolute ${thumb} rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? translate : ""
        }`}
      />
    </button>
  );
}
