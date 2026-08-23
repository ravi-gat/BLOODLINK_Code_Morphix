/**
 * BloodLink API client.
 * Centralized fetch wrapper for all backend communication.
 * Base URL: VITE_API_BASE_URL env var (default: http://localhost:8000/api)
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  errors?: { field?: string; message: string }[];

  constructor(
    message: string,
    status: number,
    errors?: { field?: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to BloodLink server. Please try again.",
      0
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await response.json();
  } catch {
    // non-JSON body (e.g. 204 No Content)
  }

  if (!response.ok) {
    const detailMsg = typeof body.detail === "string" ? body.detail : Array.isArray(body.detail) ? body.detail.map((e: any) => e.msg || e.message).join(", ") : undefined;
    const message =
      detailMsg ||
      (body.message as string) ||
      HTTP_ERROR_MESSAGES[response.status] ||
      "Unable to complete the request.";
    const errors = body.errors as { field?: string; message: string }[] | undefined;
    throw new ApiError(message, response.status, errors);
  }

  return body as T;
}

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "The request contains invalid data.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "An account with this email already exists.",
  422: "Please check the submitted information.",
  429: "Too many requests. Please slow down.",
  500: "A server error occurred. Please try again.",
  503: "The server is currently unavailable. Please try again shortly.",
};

// ── Typed API modules ─────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string, role?: string) =>
    api<ApiAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),

  register: (data: RegisterPayload) =>
    api<ApiAuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: (token: string) =>
    api<{ success: boolean; message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  resendVerification: (email: string) =>
    api<{ success: boolean; message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  logout: () =>
    api<{ success: boolean; message: string }>("/auth/logout", {
      method: "POST",
    }),

  me: () => api<ApiAuthResponse>("/auth/me"),

  forgotPassword: (email: string) =>
    api<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    api<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ success: boolean; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),
};

export const statsApi = {
  getPublicStats: () => api<PublicStatsResponse>("/stats/public"),
};

export const mapsApi = {
  getLocations: (params?: { city?: string }) => {
    const q = params?.city ? `?city=${encodeURIComponent(params.city)}` : "";
    return api<MapLocationsData>(`/maps/locations${q}`);
  },
  getNearby: (params?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    radius_km?: number;
    blood_group?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.latitude !== undefined) searchParams.set("latitude", String(params.latitude));
    if (params?.longitude !== undefined) searchParams.set("longitude", String(params.longitude));
    if (params?.city) searchParams.set("city", params.city);
    if (params?.radius_km) searchParams.set("radius_km", String(params.radius_km));
    if (params?.blood_group) searchParams.set("blood_group", params.blood_group);
    const q = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return api<NearbyMapData>(`/maps/nearby${q}`);
  },
};

export const searchApi = {
  globalSearch: (q: string, category?: string) => {
    const params = new URLSearchParams({ q });
    if (category) params.append("category", category);
    return api<GlobalSearchResponse>(`/search/global?${params.toString()}`);
  },
};

export const patientApi = {
  getProfile: () => api<PatientProfile>("/patients/me"),
  updateProfile: (data: Partial<PatientProfile>) =>
    api<PatientProfile>("/patients/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  createRequest: (data: BloodRequestPayload) =>
    api<BloodRequestData>("/blood-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyRequests: () => api<BloodRequestData[]>("/blood-requests/my"),
  getRequest: (id: string) => api<BloodRequestData>(`/blood-requests/${id}`),
  cancelRequest: (id: string) =>
    api<BloodRequestData>(`/blood-requests/${id}/cancel`, { method: "POST" }),
  getNearbyDonors: (params?: { blood_group?: string; city?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return api<DonorPublic[]>(`/patients/nearby-donors${qs}`);
  },
};

export const donorApi = {
  getProfile: () => api<DonorProfile>("/donors/me"),
  updateProfile: (data: Partial<DonorProfile>) =>
    api<DonorProfile>("/donors/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  setAvailability: (available: boolean) =>
    api<DonorProfile>("/donors/availability", {
      method: "PUT",
      body: JSON.stringify({ available }),
    }),
  getRequests: () => api<BloodRequestData[]>("/donors/requests"),
  acceptRequest: (requestId: string) =>
    api<{ success: boolean; message: string }>(
      `/donors/requests/${requestId}/accept`,
      { method: "POST" }
    ),
  declineRequest: (requestId: string) =>
    api<{ success: boolean; message: string }>(
      `/donors/requests/${requestId}/decline`,
      { method: "POST" }
    ),
  getDonations: () => api<DonationRecord[]>("/donors/donations"),
  getRewards: () => api<{ data: RewardData }>("/donors/rewards"),
};

export const hospitalApi = {
  getProfile: () => api<HospitalProfile>("/hospitals/me"),
  updateProfile: (data: Partial<HospitalProfile>) =>
    api<HospitalProfile>("/hospitals/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getInventory: () => api<InventoryItem[]>("/hospitals/inventory"),
  addInventory: (data: InventoryPayload) =>
    api<InventoryItem>("/hospitals/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateInventory: (id: string, data: Partial<InventoryPayload>) =>
    api<InventoryItem>(`/hospitals/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteInventory: (id: string) =>
    api<void>(`/hospitals/inventory/${id}`, { method: "DELETE" }),
  getRequests: () => api<BloodRequestData[]>("/hospitals/requests"),
  approveRequest: (id: string, notes?: string) =>
    api<{ success: boolean }>(`/hospitals/requests/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ status: "IN_PROGRESS", notes }),
    }),
  rejectRequest: (id: string, notes?: string) =>
    api<{ success: boolean }>(`/hospitals/requests/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ status: "CANCELLED", notes }),
    }),
  getAppointments: () => api<AppointmentData[]>("/hospitals/appointments"),
  getAnalytics: () => api<HospitalAnalytics>("/hospitals/analytics"),
};

export const bloodBankApi = {
  getProfile: () => api<BloodBankProfile>("/bloodbanks/me"),
  updateProfile: (data: Partial<BloodBankProfile>) =>
    api<BloodBankProfile>("/bloodbanks/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getInventory: () => api<InventoryItem[]>("/bloodbanks/inventory"),
  addInventory: (data: InventoryPayload) =>
    api<InventoryItem>("/bloodbanks/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateInventory: (id: string, data: Partial<InventoryPayload>) =>
    api<InventoryItem>(`/bloodbanks/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteInventory: (id: string) =>
    api<void>(`/bloodbanks/inventory/${id}`, { method: "DELETE" }),
  getRequests: () => api<BloodRequestData[]>("/bloodbanks/requests"),
  approveRequest: (id: string) =>
    api<{ success: boolean }>(`/bloodbanks/requests/${id}/approve`, {
      method: "PUT",
    }),
  getReports: () => api<BloodBankReports>("/bloodbanks/reports"),
};

export const adminApi = {
  getDashboard: () => api<AdminDashboard>("/admin/dashboard"),
  getUsers: () => api<AdminUser[]>("/admin/users"),
  getDonors: () => api<{ data: AdminDonor[] }>("/admin/donors"),
  getHospitals: () => api<{ data: AdminHospital[] }>("/admin/hospitals"),
  getBloodBanks: () => api<{ data: AdminBloodBank[] }>("/admin/bloodbanks"),
  getRequests: () => api<BloodRequestData[]>("/admin/requests"),
  activateUser: (id: string) =>
    api<{ success: boolean }>(`/admin/users/${id}/activate`, { method: "PUT" }),
  deactivateUser: (id: string) =>
    api<{ success: boolean }>(`/admin/users/${id}/deactivate`, {
      method: "PUT",
    }),
  verifyHospital: (id: string, verified: boolean) =>
    api<{ success: boolean }>(`/admin/hospitals/${id}/verify`, {
      method: "PUT",
      body: JSON.stringify({ verified }),
    }),
  verifyBloodBank: (id: string, verified: boolean) =>
    api<{ success: boolean }>(`/admin/bloodbanks/${id}/verify`, {
      method: "PUT",
      body: JSON.stringify({ verified }),
    }),
  getAnalytics: () => api<AdminAnalytics>("/admin/analytics"),
  getAuditLogs: () => api<{ data: AuditLogEntry[] }>("/admin/audit-logs"),
};

export const notificationApi = {
  getAll: () => api<ApiNotification[]>("/notifications"),
  markRead: (id: string) => api<{ success: boolean }>(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () => api<{ success: boolean }>("/notifications/read-all", { method: "PUT" }),
};

export const emergencyApi = {
  create: (data: EmergencyRequestPayload) =>
    api<EmergencyRequestData>("/emergency-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (params?: { status?: string; city?: string; blood_group?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return api<EmergencyRequestData[]>(`/emergency-requests${qs}`);
  },
  getMy: () => api<EmergencyRequestData[]>("/emergency-requests/my"),
  getById: (id: string) => api<EmergencyRequestData>(`/emergency-requests/${id}`),
  getMatches: (id: string) =>
    api<EmergencyMatchesData>(`/emergency-requests/${id}/matches`),
  updateStatus: (id: string, status: string, notes?: string) =>
    api<EmergencyRequestData>(`/emergency-requests/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, notes }),
    }),
  cancel: (id: string) =>
    api<EmergencyRequestData>(`/emergency-requests/${id}/cancel`, {
      method: "POST",
    }),
};

export const mapApi = {
  getLocations: (city?: string) => {
    const qs = city ? `?city=${encodeURIComponent(city)}` : "";
    return api<MapLocationsData>(`/maps/locations${qs}`);
  },
  getNearby: (latitude: number, longitude: number, radius_km = 50, blood_group?: string) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius_km: radius_km.toString(),
    });
    if (blood_group) params.set("blood_group", blood_group);
    return api<NearbyMapData>(`/maps/nearby?${params.toString()}`);
  },
};

export const chatApi = {
  sendMessage: (receiverId: string, message: string, requestId?: string) =>
    api<ChatMessage>("/chat/messages", {
      method: "POST",
      body: JSON.stringify({ receiver_id: receiverId, message, request_id: requestId }),
    }),
  getConversations: () => api<Conversation[]>("/chat/conversations"),
  getThread: (userId: string) => api<ChatMessage[]>(`/chat/${userId}`),
};

// ── Type definitions ──────────────────────────────────────────────────────────

export interface EmergencyRequestPayload {
  blood_group: string;
  units_required: number;
  city: string;
  urgency?: string;
  hospital_id?: string;
  notes?: string;
}

export interface EmergencyRequestData {
  id: string;
  requester_id: string;
  hospital_id?: string;
  hospital_name?: string;
  requester_name?: string;
  requester_phone?: string;
  blood_group: string;
  units_required: number;
  city: string;
  urgency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyMatchesData {
  emergency_request: EmergencyRequestData;
  compatible_blood_groups: string[];
  matched_donors: {
    type: string;
    donor_id: string;
    name: string;
    blood_group: string;
    city: string;
    same_city: boolean;
    availability: boolean;
    last_donation_date?: string;
    match_score: number;
  }[];
  blood_banks_with_stock: {
    type: string;
    blood_bank_id: string;
    blood_bank_name: string;
    blood_group: string;
    units_available: number;
    city: string;
    same_city: boolean;
  }[];
  total_donors_found: number;
  total_banks_found: number;
}

export interface MapLocationsData {
  hospitals: {
    id: string;
    type: string;
    name: string;
    registration_number: string;
    city: string;
    latitude: number;
    longitude: number;
    address: string;
  }[];
  blood_banks: {
    id: string;
    type: string;
    name: string;
    registration_number: string;
    city: string;
    latitude: number;
    longitude: number;
    address: string;
    total_units: number;
    inventory: Record<string, number>;
  }[];
  emergency_requests: {
    id: string;
    type: string;
    blood_group: string;
    units_required: number;
    urgency: string;
    city: string;
    latitude: number;
    longitude: number;
    status: string;
  }[];
  donor_clusters: {
    type: string;
    city: string;
    available_donors_count: number;
    latitude: number;
    longitude: number;
  }[];
}

export interface NearbyMapData {
  user_coordinates: { latitude: number; longitude: number };
  radius_km: number;
  hospitals: (MapLocationsData["hospitals"][0] & { distance_km: number })[];
  blood_banks: (MapLocationsData["blood_banks"][0] & {
    distance_km: number;
    has_required_group?: boolean;
  })[];
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  is_verified: boolean;
  city?: string;
  blood_group?: string;
  created_at: string;
}

export interface ApiAuthResponse {
  success: boolean;
  user?: ApiUser;
  access_token?: string;
  token_type?: string;
}

export interface PublicStatsResponse {
  success: boolean;
  registered_donors: number;
  registered_hospitals: number;
  registered_bloodbanks: number;
  completed_donations: number;
  active_requests: number;
  lives_saved: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  blood_group?: string;
  address?: string;
  hospital_name?: string;
  blood_bank_name?: string;
  registration_number?: string;
  password: string;
  confirm_password?: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  blood_group?: string;
  city?: string;
  address?: string;
  emergency_contact?: string;
  medical_notes?: string;
  name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

export interface DonorProfile {
  id: string;
  user_id: string;
  blood_group?: string;
  city?: string;
  availability: boolean;
  last_donation_date?: string;
  next_eligible_date?: string;
  health_status: string;
  verification_status: string;
  total_donations: number;
  reward_points: number;
  name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

export interface DonorPublic {
  id: string;
  blood_group?: string;
  city?: string;
  availability: boolean;
  total_donations: number;
  name?: string;
  last_donation_date?: string;
  next_eligible_date?: string;
}

export interface HospitalProfile {
  id: string;
  user_id: string;
  hospital_name: string;
  registration_number?: string;
  address?: string;
  city?: string;
  phone?: string;
  verification_status: string;
  created_at?: string;
}

export interface BloodBankProfile {
  id: string;
  user_id: string;
  bank_name: string;
  registration_number?: string;
  address?: string;
  city?: string;
  phone?: string;
  verification_status: string;
  created_at?: string;
}

export interface BloodRequestPayload {
  blood_group: string;
  units_required: number;
  urgency: string;
  city: string;
  hospital_name?: string;
  patient_name?: string;
  medical_notes?: string;
  contact_number?: string;
}

export interface BloodRequestData {
  id: string;
  blood_group: string;
  units_required: number;
  urgency: string;
  city: string;
  status: string;
  hospital_name?: string;
  patient_name?: string;
  medical_notes?: string;
  contact_number?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryPayload {
  blood_group: string;
  component_type?: string;
  units_available: number;
  expiry_date?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  blood_group: string;
  component_type: string;
  units_available: number;
  expiry_date?: string;
  notes?: string;
  updated_at: string;
}

export interface DonationRecord {
  id: string;
  blood_group: string;
  units: number;
  component_type: string;
  donation_date: string;
  status: string;
  hospital_name?: string;
  blood_bank_name?: string;
  notes?: string;
  created_at: string;
}

export interface RewardData {
  points: number;
  level: string;
  transactions: RewardTransaction[];
}

export interface RewardTransaction {
  id: string;
  type: "earned" | "redeemed";
  points: number;
  reason: string;
  balance_after: number;
  created_at: string;
}

export interface AppointmentData {
  id: string;
  donor_id: string;
  hospital_id: string;
  appointment_date: string;
  status: string;
  notes?: string;
  donor_name?: string;
  donor_blood_group?: string;
}

export interface HospitalAnalytics {
  data: {
    total_requests: number;
    completed_requests: number;
    pending_requests: number;
    fulfillment_rate: number;
    blood_group_distribution: { blood_group: string; count: number }[];
  };
}

export interface BloodBankReports {
  data: {
    total_units: number;
    inventory_by_type: { blood_group: string; units: number; expiry_date?: string }[];
    expiring_soon_count: number;
    expired_count: number;
    expiring_items: { id: string; blood_group: string; units: number; expiry_date?: string }[];
  };
}

export interface AdminDashboard {
  data: {
    total_users: number;
    total_donors: number;
    active_donors: number;
    total_hospitals: number;
    total_blood_banks: number;
    active_requests: number;
    completed_requests: number;
    total_blood_units: number;
    pending_verifications: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  is_verified: boolean;
  city?: string;
  blood_group?: string;
  created_at: string;
}

export interface AdminDonor {
  id: string;
  name: string;
  email: string;
  blood_group?: string;
  city?: string;
  availability: boolean;
  total_donations: number;
  verification_status: string;
  status: string;
  created_at?: string;
}

export interface AdminHospital {
  id: string;
  name: string;
  email: string;
  city?: string;
  phone?: string;
  verification_status: string;
  user_status: string;
  registration_number?: string;
  created_at?: string;
}

export interface AdminBloodBank {
  id: string;
  name: string;
  email: string;
  city?: string;
  phone?: string;
  verification_status: string;
  user_status: string;
  registration_number?: string;
  created_at?: string;
}

export interface AdminAnalytics {
  data: {
    requests_by_status: { status: string; count: number }[];
    blood_type_distribution: { blood_group: string; count: number }[];
    users_by_role: { role: string; count: number }[];
    top_cities: { city: string; donor_count: number }[];
  };
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  action: string;
  entity?: string;
  entity_id?: string;
  ip_address?: string;
  created_at: string;
}

export interface ApiNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  meta?: Record<string, unknown>;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  request_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface Conversation {
  other_user_id: string;
  other_user_name?: string;
  other_user_role?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface BloodGroupSearchResult {
  blood_group: string;
  can_donate_to: string[];
  can_receive_from: string[];
  is_universal_donor: boolean;
  is_universal_recipient: boolean;
  available_donors_count: number;
  available_units_count: number;
}

export interface FacilitySearchResult {
  id: string;
  type: "HOSPITAL" | "BLOOD_BANK";
  name: string;
  city: string;
  address?: string;
  registration_number?: string;
  total_units?: number;
}

export interface RequestSearchResult {
  id: string;
  blood_group: string;
  units_required: number;
  urgency: string;
  city: string;
  status: string;
  hospital_name?: string;
  created_at: string;
}

export interface DonorSearchResult {
  id: string;
  name: string;
  city: string;
  blood_group?: string;
  availability: boolean;
}

export interface QuickActionItem {
  title: string;
  path: string;
  icon: string;
}

export interface GlobalSearchResponse {
  success: boolean;
  data: {
    query: string;
    blood_group: BloodGroupSearchResult | null;
    facilities: FacilitySearchResult[];
    requests: RequestSearchResult[];
    donors: DonorSearchResult[];
    quick_actions: QuickActionItem[];
  };
}
