// Shared civic vocabulary: categories, statuses, colours and icons.
import {
  Building2,
  Construction,
  Droplets,
  Lightbulb,
  ShieldAlert,
  Trash2,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Category, Status } from "./types";

export const CATEGORIES: Category[] = [
  "roads_potholes",
  "garbage_sanitation",
  "water_supply",
  "drainage_sewage",
  "streetlights",
  "electricity",
  "public_safety",
  "other",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  roads_potholes: "Roads & potholes",
  garbage_sanitation: "Garbage & sanitation",
  water_supply: "Water supply",
  drainage_sewage: "Drainage & sewage",
  streetlights: "Streetlights",
  electricity: "Electricity",
  public_safety: "Public safety",
  other: "Other infrastructure",
};

// Map-pin palette per category (design system "category_pins").
export const CATEGORY_COLORS: Record<Category, string> = {
  roads_potholes: "#EA580C",
  garbage_sanitation: "#16A34A",
  water_supply: "#0284C7",
  drainage_sewage: "#7C3AED",
  streetlights: "#D97706",
  electricity: "#CA8A04",
  public_safety: "#DC2626",
  other: "#4B5563",
};

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  roads_potholes: Construction,
  garbage_sanitation: Trash2,
  water_supply: Droplets,
  drainage_sewage: Waves,
  streetlights: Lightbulb,
  electricity: Zap,
  public_safety: ShieldAlert,
  other: Building2,
};

export const STATUSES: Status[] = [
  "reported",
  "under_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];

export const STATUS_LABELS: Record<Status, string> = {
  reported: "Reported",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

// Badge surfaces per status (design system badge tokens).
export const STATUS_BADGE_CLASS: Record<Status, string> = {
  reported: "bg-[#FEE2E2] text-[#991B1B]",
  under_review: "bg-[#FEF3C7] text-[#92400E]",
  assigned: "bg-[#E0E7FF] text-[#3730A3]",
  in_progress: "bg-[#E0F2FE] text-[#075985]",
  resolved: "bg-[#DCFCE7] text-[#166534]",
  rejected: "bg-[#F1F5F9] text-[#475569]",
};

// Statuses an open complaint can still be in (everything but terminal states).
export const OPEN_STATUSES: Status[] = ["reported", "under_review", "assigned", "in_progress"];
