import { BloodLinkLogo } from "./BloodLinkLogo";
import { useThemeStore } from "../../stores/useThemeStore";

interface HeaderProps {
  showLogo?: boolean;
  className?: string;
}

export function Header({ showLogo = true, className = "" }: HeaderProps) {
  const { dark } = useThemeStore();

  return (
    <header
      className={`${
        dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
      } border-b ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {showLogo && <BloodLinkLogo size="md" />}
        <div className="flex-1" />
      </div>
    </header>
  );
}
