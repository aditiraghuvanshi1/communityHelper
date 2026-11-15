// Hand-written mirrors of the Pydantic models in backend/models — keep both sides
// in sync in the same edit. Nothing infers across the Python↔TypeScript boundary.

export type Category =
  | "roads_potholes"
  | "garbage_sanitation"
  | "water_supply"
  | "drainage_sewage"
  | "streetlights"
  | "electricity"
  | "public_safety"
  | "other";

export type Status =
  | "reported"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "citizen" | "admin";
  created_at: string;
}

export interface StatusEvent {
  id: string;
  status: Status;
  remark: string;
  actor_name: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  state: string;
  district: string;
  town: string;
  locality: string;
  address: string;
  lat: number;
  lng: number;
  photos: string[];
  reporter_id: string;
  reporter_name: string;
  upvote_count: number;
  viewer_has_voted: boolean;
  created_at: string;
  updated_at: string;
  resolution_photo?: string | null;
  resolution_remark?: string | null;
  resolved_at?: string | null;
}

export interface ComplaintDetail extends Complaint {
  history: StatusEvent[];
}

export interface ComplaintPage {
  items: Complaint[];
  total: number;
}

export interface AdminStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  daily: { date: string; count: number }[];
}

export interface GeocodeAddress {
  state?: string | null;
  district?: string | null;
  city?: string | null;
  suburb?: string | null;
  road?: string | null;
  postcode?: string | null;
}

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
  address: GeocodeAddress;
}
