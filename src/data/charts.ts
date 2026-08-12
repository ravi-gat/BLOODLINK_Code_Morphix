import type { MonthlyData, BloodTypeData, WeeklyData } from "../types";

export const MONTHLY_DATA: MonthlyData[] = [
  { month: "Jan", donations: 420, requests: 380, fulfilled: 360 },
  { month: "Feb", donations: 380, requests: 340, fulfilled: 320 },
  { month: "Mar", donations: 510, requests: 460, fulfilled: 440 },
  { month: "Apr", donations: 470, requests: 420, fulfilled: 400 },
  { month: "May", donations: 590, requests: 530, fulfilled: 515 },
  { month: "Jun", donations: 640, requests: 580, fulfilled: 565 },
  { month: "Jul", donations: 720, requests: 650, fulfilled: 635 },
  { month: "Aug", donations: 680, requests: 610, fulfilled: 595 },
];

export const BLOOD_TYPE_DATA: BloodTypeData[] = [
  { name: "O+", value: 38, color: "#E53935" },
  { name: "A+", value: 28, color: "#1565C0" },
  { name: "B+", value: 18, color: "#43A047" },
  { name: "AB+", value: 6, color: "#F9A825" },
  { name: "O-", value: 5, color: "#7C3AED" },
  { name: "A-", value: 3, color: "#0891B2" },
  { name: "B-", value: 1.5, color: "#DB2777" },
  { name: "AB-", value: 0.5, color: "#EA580C" },
];

export const WEEKLY_DATA: WeeklyData[] = [
  { week: "Week 1", collections: 42, distributions: 38, expired: 2 },
  { week: "Week 2", collections: 56, distributions: 51, expired: 3 },
  { week: "Week 3", collections: 48, distributions: 45, expired: 1 },
  { week: "Week 4", collections: 61, distributions: 57, expired: 4 },
];

export const DONOR_GROWTH_DATA = [
  { month: "Jan", donors: 1050, patients: 820 },
  { month: "Feb", donors: 1180, patients: 940 },
  { month: "Mar", donors: 1320, patients: 1050 },
  { month: "Apr", donors: 1480, patients: 1190 },
  { month: "May", donors: 1650, patients: 1340 },
  { month: "Jun", donors: 1820, patients: 1500 },
  { month: "Jul", donors: 2050, patients: 1680 },
  { month: "Aug", donors: 2240, patients: 1850 },
];

export const HOSPITAL_USAGE_DATA = [
  { name: "AIIMS", requests: 148, fulfilled: 142 },
  { name: "Apollo", requests: 112, fulfilled: 108 },
  { name: "Fortis", requests: 94, fulfilled: 89 },
  { name: "Max", requests: 76, fulfilled: 71 },
  { name: "Narayana", requests: 68, fulfilled: 65 },
  { name: "Medanta", requests: 58, fulfilled: 54 },
];

export const REWARD_TREND_DATA = [
  { month: "Mar", points: 70 },
  { month: "Apr", points: 150 },
  { month: "May", points: 230 },
  { month: "Jun", points: 310 },
  { month: "Jul", points: 750 },
  { month: "Aug", points: 820 },
];

export const INVENTORY_TREND_DATA = [
  { date: "Aug 1", stock: 340 },
  { date: "Aug 2", stock: 328 },
  { date: "Aug 3", stock: 315 },
  { date: "Aug 4", stock: 302 },
  { date: "Aug 5", stock: 312 },
];
