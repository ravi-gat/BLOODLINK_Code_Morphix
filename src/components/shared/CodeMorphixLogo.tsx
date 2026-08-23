interface CodeMorphixLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  lightText?: boolean;
}

const SIZE_MAP = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export function CodeMorphixLogo({
  size = "md",
  className = "",
  showText = true,
  lightText = false,
}: CodeMorphixLogoProps) {
  const sizeClass = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/logos/code-morphix.svg"
        alt="Code Morphix — Transforming Ideas Into Innovation"
        className={`${sizeClass} object-contain flex-shrink-0`}
      />
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight text-xs uppercase leading-none ${
              lightText ? "text-white" : "text-foreground"
            }`}
          >
            Code Morphix
          </span>
          <span
            className={`text-[9px] font-medium tracking-wide mt-0.5 ${
              lightText ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            Transforming Ideas Into Innovation
          </span>
        </div>
      )}
    </div>
  );
}
