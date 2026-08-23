import { AppHeader } from "../components/shared/AppHeader";

interface TopNavbarProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
}

export function TopNavbar({ onMobileMenuToggle, pageTitle }: TopNavbarProps) {
  return (
    <AppHeader
      variant="dashboard"
      onMobileMenuToggle={onMobileMenuToggle}
      pageTitle={pageTitle}
    />
  );
}
