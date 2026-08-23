import { useThemeStore } from "../../stores/useThemeStore";
import { BloodLinkLogo } from "./BloodLinkLogo";

export function Footer() {
  const { dark } = useThemeStore();

  return (
    <footer
      className={`border-t ${
        dark ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-gray-50"
      } py-6 px-4`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BloodLinkLogo size="sm" />
          </div>

          <div
            className={`text-xs ${
              dark ? "text-gray-500" : "text-gray-600"
            }`}
          >
            <p>© 2026 BloodLink. AI-Enabled Blood Management Network</p>
          </div>

          <div
            className={`text-xs ${
              dark ? "text-gray-500" : "text-gray-600"
            }`}
          >
            <a
              href="#"
              className="hover:text-red-600 transition-colors mr-4"
            >
              Privacy Policy
            </a>
            <a href="#" className="hover:text-red-600 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
