import { CodeMorphixLogo } from "./CodeMorphixLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© 2026 BloodLink Health Systems.</span>
            <span className="hidden sm:inline text-border">·</span>
            <CodeMorphixLogo size="xs" />
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <span>·</span>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <span>·</span>
            <a href="#" className="hover:text-foreground transition-colors">
              Clinical Compliance
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
