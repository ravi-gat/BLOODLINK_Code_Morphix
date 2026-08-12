import type { RewardTransaction, RewardTier } from "../types";

export const REWARD_TIERS: RewardTier[] = [
  {
    name: "Bronze",
    minPoints: 0,
    maxPoints: 299,
    color: "#CD7F32",
    icon: "🥉",
    benefits: ["Digital donation certificate", "Platform recognition badge"],
  },
  {
    name: "Silver",
    minPoints: 300,
    maxPoints: 699,
    color: "#94A3B8",
    icon: "🥈",
    benefits: ["All Bronze benefits", "Priority donor listing", "Early access to camp registrations"],
  },
  {
    name: "Gold",
    minPoints: 700,
    maxPoints: 1299,
    color: "#F9A825",
    icon: "🥇",
    benefits: ["All Silver benefits", "Free annual health check-up", "Exclusive donor community access"],
  },
  {
    name: "Platinum",
    minPoints: 1300,
    maxPoints: 2499,
    color: "#7C3AED",
    icon: "💎",
    benefits: ["All Gold benefits", "Emergency donor priority badge", "BloodLink branded merchandise kit"],
  },
  {
    name: "Legend",
    minPoints: 2500,
    maxPoints: Infinity,
    color: "#E53935",
    icon: "🏆",
    benefits: [
      "All Platinum benefits",
      "Annual BloodLink Heroes gala invite",
      "Lifetime achievement recognition",
      "Media feature opportunity",
    ],
  },
];

export const REWARD_TRANSACTIONS: RewardTransaction[] = [
  { id: "rt001", donorId: "d001", type: "earned", points: 70, reason: "Whole blood donation at AIIMS Delhi", date: "Mar 12, 2024", balance: 820 },
  { id: "rt002", donorId: "d001", type: "earned", points: 50, reason: "Responded to emergency request", date: "Mar 12, 2024", balance: 750 },
  { id: "rt003", donorId: "d001", type: "earned", points: 90, reason: "Platelet donation at Apollo Hospitals", date: "Nov 28, 2023", balance: 700 },
  { id: "rt004", donorId: "d001", type: "earned", points: 30, reason: "Referred new donor - Kunal Joshi", date: "Jul 12, 2023", balance: 610 },
  { id: "rt005", donorId: "d001", type: "earned", points: 70, reason: "Whole blood donation at Fortis Healthcare", date: "Aug 5, 2023", balance: 580 },
  { id: "rt006", donorId: "d001", type: "redeemed", points: -100, reason: "Redeemed for free health check-up", date: "Sep 1, 2023", balance: 510 },
  { id: "rt007", donorId: "d001", type: "earned", points: 80, reason: "Plasma donation at Max Hospital", date: "Apr 19, 2023", balance: 430 },
  { id: "rt008", donorId: "d001", type: "earned", points: 20, reason: "Profile completion bonus", date: "Jan 15, 2022", balance: 20 },
];
