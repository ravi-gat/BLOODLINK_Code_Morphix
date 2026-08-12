import { BrowserRouter, Routes, Route } from "react-router";

// Landing page (existing App)
import LandingApp from "../app/App";

// Layouts
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";

// Protected route guard
import { ProtectedRoute } from "./ProtectedRoute";

// Auth pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { OTPVerificationPage } from "../pages/auth/OTPVerificationPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";

// Shared pages (reused by all roles)
import { NotificationsPage } from "../pages/shared/NotificationsPage";
import { ProfilePage } from "../pages/shared/ProfilePage";
import { SettingsPage } from "../pages/shared/SettingsPage";

// Patient pages
import { PatientDashboard } from "../pages/patient/PatientDashboard";
import { SearchBloodPage } from "../pages/patient/SearchBloodPage";
import { EmergencyRequestPage } from "../pages/patient/EmergencyRequestPage";
import { RequestHistoryPage } from "../pages/patient/RequestHistoryPage";
import { NearbyDonorsPage } from "../pages/patient/NearbyDonorsPage";

// Donor pages
import { DonorDashboard } from "../pages/donor/DonorDashboard";
import { DonationRequestsPage } from "../pages/donor/DonationRequestsPage";
import { DonationHistoryPage } from "../pages/donor/DonationHistoryPage";
import { RewardsPage } from "../pages/donor/RewardsPage";
import { AvailabilityPage } from "../pages/donor/AvailabilityPage";
import { HealthStatusPage } from "../pages/donor/HealthStatusPage";

// Hospital pages
import { HospitalDashboard } from "../pages/hospital/HospitalDashboard";
import { BloodInventoryPage } from "../pages/hospital/BloodInventoryPage";
import { HospitalEmergencyPage } from "../pages/hospital/HospitalEmergencyPage";
import { PatientsPage } from "../pages/hospital/PatientsPage";
import { AppointmentsPage } from "../pages/hospital/AppointmentsPage";
import { AnalyticsPage } from "../pages/hospital/AnalyticsPage";

// Blood Bank pages
import { BloodBankDashboard } from "../pages/bloodbank/BloodBankDashboard";
import { BBInventoryPage } from "../pages/bloodbank/BBInventoryPage";
import { CollectionPage } from "../pages/bloodbank/CollectionPage";
import { DistributionPage } from "../pages/bloodbank/DistributionPage";
import { ExpiryTrackingPage } from "../pages/bloodbank/ExpiryTrackingPage";
import { BBRequestsPage } from "../pages/bloodbank/BBRequestsPage";
import { BBReportsPage } from "../pages/bloodbank/BBReportsPage";

// Admin pages
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminDonorsPage } from "../pages/admin/AdminDonorsPage";
import { AdminHospitalsPage } from "../pages/admin/AdminHospitalsPage";
import { AdminBloodBanksPage } from "../pages/admin/AdminBloodBanksPage";
import { AdminEmergencyPage } from "../pages/admin/AdminEmergencyPage";
import { AdminReportsPage } from "../pages/admin/AdminReportsPage";
import { AdminAnalyticsPage } from "../pages/admin/AdminAnalyticsPage";

// 404
import { NotFoundPage } from "../pages/shared/NotFoundPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth routes ─────────────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── Patient routes ──────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="patient" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/search" element={<SearchBloodPage />} />
            <Route path="/patient/emergency" element={<EmergencyRequestPage />} />
            <Route path="/patient/history" element={<RequestHistoryPage />} />
            <Route path="/patient/nearby" element={<NearbyDonorsPage />} />
            <Route path="/patient/notifications" element={<NotificationsPage />} />
            <Route path="/patient/profile" element={<ProfilePage />} />
            <Route path="/patient/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Donor routes ────────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="donor" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/donor/requests" element={<DonationRequestsPage />} />
            <Route path="/donor/history" element={<DonationHistoryPage />} />
            <Route path="/donor/rewards" element={<RewardsPage />} />
            <Route path="/donor/availability" element={<AvailabilityPage />} />
            <Route path="/donor/health" element={<HealthStatusPage />} />
            <Route path="/donor/notifications" element={<NotificationsPage />} />
            <Route path="/donor/profile" element={<ProfilePage />} />
            <Route path="/donor/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Hospital routes ─────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="hospital" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/hospital/inventory" element={<BloodInventoryPage />} />
            <Route path="/hospital/emergency" element={<HospitalEmergencyPage />} />
            <Route path="/hospital/patients" element={<PatientsPage />} />
            <Route path="/hospital/appointments" element={<AppointmentsPage />} />
            <Route path="/hospital/analytics" element={<AnalyticsPage />} />
            <Route path="/hospital/notifications" element={<NotificationsPage />} />
            <Route path="/hospital/profile" element={<ProfilePage />} />
            <Route path="/hospital/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Blood Bank routes ───────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="bloodbank" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/bloodbank/dashboard" element={<BloodBankDashboard />} />
            <Route path="/bloodbank/inventory" element={<BBInventoryPage />} />
            <Route path="/bloodbank/collection" element={<CollectionPage />} />
            <Route path="/bloodbank/distribution" element={<DistributionPage />} />
            <Route path="/bloodbank/expiry" element={<ExpiryTrackingPage />} />
            <Route path="/bloodbank/requests" element={<BBRequestsPage />} />
            <Route path="/bloodbank/reports" element={<BBReportsPage />} />
            <Route path="/bloodbank/notifications" element={<NotificationsPage />} />
            <Route path="/bloodbank/profile" element={<ProfilePage />} />
            <Route path="/bloodbank/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Admin routes ────────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/donors" element={<AdminDonorsPage />} />
            <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
            <Route path="/admin/bloodbanks" element={<AdminBloodBanksPage />} />
            <Route path="/admin/emergency" element={<AdminEmergencyPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Landing page ────────────────────────────────────────── */}
        <Route path="/" element={<LandingApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
