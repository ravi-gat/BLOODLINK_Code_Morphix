// ─── Auth & User ─────────────────────────────────────────────────────────────

export type UserRole = "patient" | "donor" | "hospital" | "bloodbank" | "admin";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bloodGroup?: BloodGroup;
  phone?: string;
  city?: string;
  avatar?: string;
  initials: string;
  verified: boolean;
  createdAt: string;
}

export interface PublicStats {
  registeredDonors: number;
  registeredHospitals: number;
  registeredBloodbanks: number;
  completedDonations: number;
  activeRequests: number;
  livesSaved: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean }>;
  logout: () => void;
  setUser: (user: User) => void;
  restoreSession: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
  bloodGroup?: BloodGroup;
  phone: string;
  city: string;
  address?: string;
  hospitalName?: string;
  bloodBankName?: string;
  registrationNumber?: string;
}

// ─── Donor ───────────────────────────────────────────────────────────────────

export interface Donor {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  city: string;
  distance?: string;
  available: boolean;
  verified: boolean;
  rating: number;
  totalDonations: number;
  lastDonated: string;
  nextEligible: string;
  healthScore: number;
  rewardPoints: number;
  livesSaved: number;
  badges: Badge[];
  joinedAt: string;
  responseTime: string;
  age: number;
  weight: number;
  hemoglobin: number;
}

export interface Badge {
  id: string;
  icon: string;
  label: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

export interface DonationRecord {
  id: string;
  donorId: string;
  donorName: string;
  hospital: string;
  date: string;
  type: "Whole Blood" | "Platelet" | "Plasma" | "Double Red Cell";
  units: number;
  status: "Completed" | "Scheduled" | "Cancelled" | "Pending";
  certificate?: string;
  rewardEarned: number;
  patientId?: string;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  city: string;
  hospital?: string;
  diagnosis?: string;
  emergencyContact?: string;
  joinedAt: string;
}

// ─── Blood Request ────────────────────────────────────────────────────────────

export type RequestStatus =
  | "Pending"
  | "Matched"
  | "In Progress"
  | "Fulfilled"
  | "Cancelled"
  | "Expired";
export type UrgencyLevel = "Critical" | "High" | "Moderate" | "Low";

export interface BloodRequest {
  id: string;
  patientId: string;
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  urgency: UrgencyLevel;
  hospital: string;
  city: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  doctor?: string;
  diagnosis?: string;
  notes?: string;
  matchedDonors?: string[];
  contactPhone: string;
  estimatedFulfillment?: string;
}

// ─── Hospital ────────────────────────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  verified: boolean;
  tier: "Government" | "Private" | "Trust";
  beds: number;
  bloodBankAvailable: boolean;
  joinedAt: string;
  contactPerson: string;
  status: "Active" | "Pending" | "Suspended";
}

export interface BloodInventoryItem {
  bloodGroup: BloodGroup;
  units: number;
  capacity: number;
  status: "good" | "low" | "critical";
  expiringIn?: number; // days
  lastUpdated: string;
}

export interface Appointment {
  id: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  hospitalId: string;
  hospitalName: string;
  date: string;
  time: string;
  type: "Donation" | "Screening" | "Follow-up";
  status: "Scheduled" | "Completed" | "Cancelled" | "No Show";
  notes?: string;
}

// ─── Blood Bank ───────────────────────────────────────────────────────────────

export interface BloodBank {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  verified: boolean;
  licenseNumber: string;
  capacity: number;
  currentStock: number;
  joinedAt: string;
  status: "Active" | "Pending" | "Suspended";
}

export interface CollectionRecord {
  id: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  collectedAt: string;
  volume: number; // ml
  component: "Whole Blood" | "Platelet" | "Plasma" | "Packed RBC";
  expiryDate: string;
  status: "Available" | "Issued" | "Expired" | "Quarantine";
  bagId: string;
}

export interface DistributionRecord {
  id: string;
  hospital: string;
  bloodGroup: BloodGroup;
  units: number;
  component: string;
  issuedAt: string;
  requestId?: string;
  issuedBy: string;
  receivedBy: string;
  status: "Issued" | "Delivered" | "Returned";
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType =
  | "emergency"
  | "match"
  | "system"
  | "reward"
  | "reminder"
  | "approval"
  | "info";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  meta?: Record<string, unknown>;
}

// ─── Reward ──────────────────────────────────────────────────────────────────

export interface RewardTransaction {
  id: string;
  donorId: string;
  type: "earned" | "redeemed";
  points: number;
  reason: string;
  date: string;
  balance: number;
}

export interface RewardTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  benefits: string[];
  icon: string;
}

// ─── Chart Data ──────────────────────────────────────────────────────────────

export interface MonthlyData {
  month: string;
  donations: number;
  requests: number;
  fulfilled?: number;
}

export interface BloodTypeData {
  name: BloodGroup;
  value: number;
  color: string;
}

export interface DailyData {
  day: string;
  count: number;
}

export interface WeeklyData {
  week: string;
  collections: number;
  distributions: number;
  expired: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

export interface SidebarConfig {
  role: UserRole;
  items: NavItem[];
}
