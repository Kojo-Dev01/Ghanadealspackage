/* Shared domain types — used across API, web, and admin apps. */

// ---- Enums ----

export type ListingType = "sale" | "rent" | "new" | "land" | "uncompleted";
export type ModerationStatus = "pending" | "approved" | "flagged" | "archived";
export type InquiryStatus = "new" | "read" | "responded" | "closed";

// ---- Agent ----

export interface Agent {
  id: string;
  name: string;
  company: string;
  phone: string;
  color: string;
  rating: number;
  areas: string[];
  years: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Property (DB row shape, snake_case) ----

export interface PropertyRow {
  id: string;
  agent_id: string;
  title: string;
  listing_type: ListingType;
  price: number;
  price_label: string | null;
  region: string;
  location: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  description: string;
  image: string;
  image_lg: string | null;
  gallery: string[];
  badges: string[];
  photos: number;
  amenities: string[];
  ref: string;
  furnishing: string;
  parking: string;
  featured: boolean;
  moderation_status: ModerationStatus;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Property with embedded agent (API response shape) ----

export interface Property extends Omit<PropertyRow, "agent_id"> {
  agent: Pick<Agent, "id" | "name" | "company" | "phone" | "color">;
}

// ---- Paginated response ----

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ---- Inquiry ----

export interface Inquiry {
  id: string;
  property_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

// ---- Admin stats ----

export interface AdminStats {
  totals: {
    listings: number;
    pending: number;
    approved: number;
    flagged: number;
    agents: number;
    inquiries: number;
  };
  recentActivity: { time: string; item: string }[];
}

// ---- Admin listing (flattened for admin views) ----

export interface AdminListing {
  id: string;
  title: string;
  listingType: ListingType;
  region: string;
  type: string;
  priceFormatted: string;
  submittedAt: string;
  moderationStatus: ModerationStatus;
  agentName: string;
}
