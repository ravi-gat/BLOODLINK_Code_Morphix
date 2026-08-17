import { create } from "zustand";
import type { User, UserRole, RegisterData } from "../types";
import { authApi, ApiError } from "../services/api";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  restoreSession: () => Promise<void>;
}

export const DEMO_CREDENTIALS: Record<UserRole, { email: string }> = {
  patient: { email: "patient@bloodlink.demo" },
  donor: { email: "donor@bloodlink.demo" },
  hospital: { email: "hospital@bloodlink.demo" },
  bloodbank: { email: "bloodbank@bloodlink.demo" },
  admin: { email: "admin@bloodlink.demo" },
};

function toAppUser(apiUser: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_verified?: boolean;
  city?: string;
  blood_group?: string;
  created_at?: string;
}): User {
  const initials = apiUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    bloodGroup: apiUser.blood_group as User["bloodGroup"],
    phone: apiUser.phone,
    city: apiUser.city,
    initials,
    verified: apiUser.is_verified ?? false,
    createdAt: apiUser.created_at
      ? new Date(apiUser.created_at).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  };
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password, role) => {
    set({ isLoading: true });
    try {
      const result = await authApi.login(email, password, role);
      set({ user: toAppUser(result.user), isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const result = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        role: data.role,
        blood_group: data.bloodGroup,
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      set({ user: toAppUser(result.user), isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    void authApi.logout().catch(() => undefined);
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const result = await authApi.me();
      set({ user: toAppUser(result.user), isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export function getRoleDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    patient: "/patient/dashboard",
    donor: "/donor/dashboard",
    hospital: "/hospital/dashboard",
    bloodbank: "/bloodbank/dashboard",
    admin: "/admin/dashboard",
  };
  return paths[role] ?? "/";
}
