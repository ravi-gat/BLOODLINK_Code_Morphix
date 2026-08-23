import React from "react";

export interface CodeMorphixBrandingProps {
  variant?: "header" | "sidebar" | "auth" | "hero" | "footer" | "badge";
  className?: string;
  lightText?: boolean;
  collapsed?: boolean;
}

export function CodeMorphixBranding({
  variant = "header",
  className = "",
  lightText = false,
  collapsed = false,
}: CodeMorphixBrandingProps) {
  const logoImg = (sizeClass: string) => (
    <img
      src="/logos/code-morphix.svg"
      alt="Code Morphix"
      className={`${sizeClass} object-contain flex-shrink-0`}
    />
  );

  switch (variant) {
    /*
     * ============================================================
     * GLOBAL HEADER
     * ============================================================
     */
    case "header":
      return (
        <div
          className={`
            flex items-center gap-3
            ml-2 pl-4
            border-l border-border/70
            select-none
            ${className}
          `}
        >
          {/* ACTUAL CODE MORPHIX LOGO */}
          {logoImg("w-9 h-9 sm:w-10 sm:h-10")}

          <div className="flex flex-col justify-center leading-tight">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Powered by
            </span>

            <span
              className={`
                text-sm sm:text-base
                font-extrabold
                tracking-tight
                ${
                  lightText
                    ? "text-white"
                    : "text-foreground dark:text-white"
                }
              `}
            >
              Code Morphix
            </span>
          </div>
        </div>
      );

    /*
     * ============================================================
     * SIDEBAR
     * ============================================================
     */
    case "sidebar":
      if (collapsed) {
        return (
          <div
            className={`
              flex justify-center
              py-3
              border-b border-border/70
              ${className}
            `}
            title="Powered by Code Morphix"
          >
            {logoImg("w-9 h-9")}
          </div>
        );
      }

      return (
        <div
          className={`
            px-4 py-4
            border-b border-border/70
            bg-muted/20
            select-none
            ${className}
          `}
        >
          <div className="flex items-center gap-3">
            {/* LARGE ACTUAL LOGO */}
            {logoImg("w-11 h-11")}

            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Powered by
              </span>

              <span className="text-sm font-extrabold text-foreground dark:text-white">
                Code Morphix
              </span>

              <span className="text-[9px] mt-1 text-emerald-600 dark:text-emerald-400">
                Transforming Ideas Into Innovation
              </span>
            </div>
          </div>
        </div>
      );

    /*
     * ============================================================
     * HERO
     * ============================================================
     */
    case "hero":
      return (
        <div
          className={`
            inline-flex items-center gap-4
            px-5 py-3
            rounded-2xl
            bg-white/15
            backdrop-blur-md
            border border-white/25
            text-white
            shadow-lg
            select-none
            ${className}
          `}
        >
          {logoImg("w-11 h-11")}

          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-white/70">
              Powered by
            </span>

            <span className="text-base font-extrabold text-white tracking-wide">
              Code Morphix
            </span>

            <span className="text-[9px] mt-1 text-white/60">
              Transforming Ideas Into Innovation
            </span>
          </div>
        </div>
      );

    /*
     * ============================================================
     * AUTH
     * ============================================================
     */
    case "auth":
      return (
        <div
          className={`
            inline-flex items-center gap-3
            px-4 py-3
            rounded-2xl
            bg-card
            border border-border
            shadow-sm
            select-none
            ${className}
          `}
        >
          {logoImg("w-10 h-10")}

          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Powered by
            </span>

            <span
              className={`
                text-sm font-extrabold
                ${
                  lightText
                    ? "text-white"
                    : "text-foreground dark:text-white"
                }
              `}
            >
              Code Morphix
            </span>

            <span className="text-[9px] mt-1 text-emerald-600 dark:text-emerald-400">
              Transforming Ideas Into Innovation
            </span>
          </div>
        </div>
      );

    /*
     * ============================================================
     * FOOTER
     * ============================================================
     */
    case "footer":
      return (
        <div
          className={`
            flex items-center gap-3
            select-none
            ${className}
          `}
        >
          {logoImg("w-9 h-9")}

          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Powered by
            </span>

            <span
              className={`
                text-sm font-extrabold
                ${
                  lightText
                    ? "text-white"
                    : "text-foreground dark:text-white"
                }
              `}
            >
              Code Morphix
            </span>
          </div>
        </div>
      );

    /*
     * ============================================================
     * BADGE
     * ============================================================
     */
    case "badge":
    default:
      return (
        <div
          className={`
            inline-flex items-center gap-2.5
            select-none
            ${className}
          `}
        >
          {logoImg("w-8 h-8")}

          <span
            className={`
              text-sm font-bold tracking-tight
              ${
                lightText
                  ? "text-white"
                  : "text-foreground dark:text-white"
              }
            `}
          >
            Code Morphix
          </span>
        </div>
      );
  }
}