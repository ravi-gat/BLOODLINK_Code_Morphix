import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../stores/useAuthStore";
import type { UserRole } from "../types";

interface ProtectedRouteProps {
  allowedRole?: UserRole;
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their own dashboard
    const dashboards: Record<UserRole, string> = {
      patient: "/patient/dashboard",
      donor: "/donor/dashboard",
      hospital: "/hospital/dashboard",
      bloodbank: "/bloodbank/dashboard",
      admin: "/admin/dashboard",
    };
    return <Navigate to={dashboards[user.role as UserRole]} replace />;
  }

  return <Outlet />;
}
