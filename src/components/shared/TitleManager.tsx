import { useEffect } from "react";
import { useLocation } from "react-router";

const TITLE_MAP: Record<string, string> = {
  "/": "BloodLink — Blood Donation & Emergency Network",
  "/login": "BloodLink | Login",
  "/register": "BloodLink | Register",
  "/forgot-password": "BloodLink | Forgot Password",
  "/verify-otp": "BloodLink | Verify OTP",
  "/reset-password": "BloodLink | Reset Password",

  // Patient
  "/patient/dashboard": "BloodLink | Patient Dashboard",
  "/patient/search": "BloodLink | Search Blood Donors",
  "/patient/emergency": "BloodLink | Emergency Blood Request",
  "/patient/history": "BloodLink | Request History",
  "/patient/nearby": "BloodLink | Nearby Donors",
  "/patient/notifications": "BloodLink | Notifications",
  "/patient/profile": "BloodLink | My Profile",
  "/patient/settings": "BloodLink | Settings",

  // Donor
  "/donor/dashboard": "BloodLink | Donor Dashboard",
  "/donor/requests": "BloodLink | Donation Requests",
  "/donor/history": "BloodLink | Donation History",
  "/donor/rewards": "BloodLink | Rewards & Badges",
  "/donor/availability": "BloodLink | Availability Status",
  "/donor/health": "BloodLink | Health & Eligibility",
  "/donor/notifications": "BloodLink | Notifications",
  "/donor/profile": "BloodLink | Donor Profile",
  "/donor/settings": "BloodLink | Settings",

  // Hospital
  "/hospital/dashboard": "BloodLink | Hospital Dashboard",
  "/hospital/inventory": "BloodLink | Blood Inventory",
  "/hospital/emergency": "BloodLink | Emergency Blood Requests",
  "/hospital/patients": "BloodLink | Patient Management",
  "/hospital/appointments": "BloodLink | Appointments",
  "/hospital/analytics": "BloodLink | Hospital Analytics",
  "/hospital/notifications": "BloodLink | Notifications",
  "/hospital/profile": "BloodLink | Hospital Profile",
  "/hospital/settings": "BloodLink | Settings",

  // Blood Bank
  "/bloodbank/dashboard": "BloodLink | Blood Bank Dashboard",
  "/bloodbank/inventory": "BloodLink | Blood Stock Inventory",
  "/bloodbank/collection": "BloodLink | Blood Collection",
  "/bloodbank/distribution": "BloodLink | Blood Distribution",
  "/bloodbank/expiry": "BloodLink | Expiry Tracking",
  "/bloodbank/requests": "BloodLink | Urgent Requests",
  "/bloodbank/reports": "BloodLink | Stock & Expiry Reports",
  "/bloodbank/notifications": "BloodLink | Notifications",
  "/bloodbank/profile": "BloodLink | Blood Bank Profile",
  "/bloodbank/settings": "BloodLink | Settings",

  // Admin
  "/admin/dashboard": "BloodLink | Admin Dashboard",
  "/admin/users": "BloodLink | User Management",
  "/admin/donors": "BloodLink | Donor Directory",
  "/admin/hospitals": "BloodLink | Hospital Directory",
  "/admin/bloodbanks": "BloodLink | Blood Bank Directory",
  "/admin/emergency": "BloodLink | Emergency Requests",
  "/admin/reports": "BloodLink | Platform Reports",
  "/admin/analytics": "BloodLink | Platform Analytics",
  "/admin/settings": "BloodLink | System Settings",
};

export function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const title = TITLE_MAP[location.pathname] || "BloodLink — Blood Donation & Emergency Network";
    document.title = title;
  }, [location.pathname]);

  return null;
}
