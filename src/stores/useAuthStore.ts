import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole, RegisterData } from "../types";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  patient: { email: "patient@bloodlink.com", password: "Patient@123" },
  donor: { email: "donor@bloodlink.com", password: "Donor@123" },
  hospital: { email: "hospital@bloodlink.com", password: "Hospital@123" },
  bloodbank: { email: "bloodbank@bloodlink.com", password: "BloodBank@123" },
  admin: { email: "admin@bloodlink.com", password: "Admin@123" },
};

// Mock users per role for demo login
const MOCK_USERS: Record<UserRole, User> = {
  patient: {
    id: "p001",
    name: "Rohan Verma",
    email: "rohan.verma@gmail.com",
    role: "patient",
    bloodGroup: "O+",
    phone: "+91 98765 00001",
    city: "New Delhi",
    initials: "RV",
    verified: true,
    createdAt: "Jan 15, 2024",
  },
  donor: {
    id: "d001",
    name: "Arjun Mehta",
    email: "arjun.mehta@gmail.com",
    role: "donor",
    bloodGroup: "O+",
    phone: "+91 98765 43210",
    city: "New Delhi",
    initials: "AM",
    verified: true,
    createdAt: "Jan 15, 2022",
  },
  hospital: {
    id: "h001",
    name: "AIIMS New Delhi",
    email: "bloodbank@aiims.edu",
    role: "hospital",
    phone: "+91 11 2658 8500",
    city: "New Delhi",
    initials: "AI",
    verified: true,
    createdAt: "Jan 5, 2022",
  },
  bloodbank: {
    id: "bb001",
    name: "Red Cross Blood Centre",
    email: "info@redcrossdelhi.org",
    role: "bloodbank",
    phone: "+91 11 2371 6441",
    city: "New Delhi",
    initials: "RC",
    verified: true,
    createdAt: "Jan 10, 2022",
  },
  admin: {
    id: "admin001",
    name: "Admin User",
    email: "admin@bloodlink.health",
    role: "admin",
    phone: "+91 00000 00000",
    city: "New Delhi",
    initials: "AU",
    verified: true,
    createdAt: "Jan 1, 2022",
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password, role) => {
        set({ isLoading: true });
        await new Promise((res) => setTimeout(res, 800));
        const credentials = DEMO_CREDENTIALS[role];
        if (email.trim().toLowerCase() !== credentials.email || password !== credentials.password) {
          set({ isLoading: false });
          throw new Error("INVALID_CREDENTIALS");
        }
        const user = MOCK_USERS[role];
        set({ user: { ...user, email: credentials.email }, isAuthenticated: true, isLoading: false });
      },

      register: async (data) => {
        set({ isLoading: true });
        await new Promise((res) => setTimeout(res, 1000));
        const initials = data.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const newUser: User = {
          id: `user_${Date.now()}`,
          name: data.name,
          email: data.email,
          role: data.role,
          bloodGroup: data.bloodGroup,
          phone: data.phone,
          city: data.city,
          initials,
          verified: false,
          createdAt: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        };
        set({ user: newUser, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: "bloodlink-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Derived helpers
export const getRoleDashboardPath = (role: UserRole): string => {
  const paths: Record<UserRole, string> = {
    patient: "/patient/dashboard",
    donor: "/donor/dashboard",
    hospital: "/hospital/dashboard",
    bloodbank: "/bloodbank/dashboard",
    admin: "/admin/dashboard",
  };
  return paths[role];
};
