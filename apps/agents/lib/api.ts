import { cookies } from "next/headers";

const SESSION_COOKIE = "gd_agent_session";

function getApiBaseUrl() {
  if (process.env.API_INTERNAL_URL) return process.env.API_INTERNAL_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return "http://localhost:4000";
}

async function fetchEndpoint(
  path: string,
  token?: string,
  init?: RequestInit
) {
  const url = `${getApiBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
}

async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

// ── Auth ───────────────────────────────────────────────────

type LoginResult =
  | {
      ok: true;
      data: {
        token: string;
        user: { id: string; email: string; name: string; role: string };
        agent: AgentProfile | null;
      };
    }
  | { ok: false; reason: "invalid" | "forbidden" | "config" };

export async function loginAgent(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const res = await fetchEndpoint("/v1/auth/login", undefined, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 503) return { ok: false, reason: "config" };
    if (res.status === 401) return { ok: false, reason: "invalid" };

    const data = await res.json();
    if (!res.ok) return { ok: false, reason: "invalid" };
    if (data.user?.role !== "agent") return { ok: false, reason: "forbidden" };

    return { ok: true, data };
  } catch {
    return { ok: false, reason: "config" };
  }
}

// ── Types ──────────────────────────────────────────────────

export type AgentProfile = {
  id: string;
  user_id?: string;
  name: string;
  company: string;
  phone: string;
  color: string;
  avatar_url?: string | null;
  rating: number;
  areas: string[];
  years: number;
  verified: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DashboardStats = {
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  totalInquiries: number;
  newInquiries: number;
};

export type DashboardListing = {
  id: string;
  title: string;
  listingType: string;
  price: number;
  priceFormatted: string;
  priceLabel?: string;
  region: string;
  location: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  imageLg?: string;
  gallery: string[];
  description: string;
  amenities: string[];
  furnishing: string;
  parking: string;
  latitude?: number;
  longitude?: number;
  floorPlans: string[];
  featured: boolean;
  moderationStatus: string;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardInquiry = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
};

// ── Dashboard API ──────────────────────────────────────────

export async function fetchAgentStats(): Promise<DashboardStats | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetchEndpoint("/v1/agent/stats", token);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAgentProfile(): Promise<AgentProfile | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetchEndpoint("/v1/agent/profile", token);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateAgentProfile(
  data: Partial<{
    name: string;
    company: string;
    phone: string;
    color: string;
    areas: string[];
    years: number;
    avatar_url: string | null;
  }>
): Promise<AgentProfile | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetchEndpoint("/v1/agent/profile", token, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAgentListings(
  params?: { status?: string; listingType?: string; page?: number }
): Promise<{ items: DashboardListing[]; total: number; page: number; limit: number }> {
  const token = await getSessionToken();
  const empty = { items: [], total: 0, page: 1, limit: 12 };
  if (!token) return empty;
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.listingType) sp.set("listing_type", params.listingType);
  if (params?.page) sp.set("page", String(params.page));
  try {
    const res = await fetchEndpoint(`/v1/agent/listings?${sp}`, token);
    if (!res.ok) return empty;
    return await res.json();
  } catch {
    return empty;
  }
}

export async function fetchAgentInquiries(
  params?: { status?: string; page?: number }
): Promise<{ items: DashboardInquiry[]; total: number; page: number; limit: number }> {
  const token = await getSessionToken();
  const empty = { items: [], total: 0, page: 1, limit: 20 };
  if (!token) return empty;
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  try {
    const res = await fetchEndpoint(`/v1/agent/inquiries?${sp}`, token);
    if (!res.ok) return empty;
    return await res.json();
  } catch {
    return empty;
  }
}

// ── Inquiry Actions ────────────────────────────────────────

export async function updateInquiryStatus(
  id: string,
  status: "new" | "read" | "responded" | "closed"
): Promise<{ ok: boolean; message: string }> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: "Not authenticated" };
  try {
    const res = await fetchEndpoint(`/v1/agent/inquiries/${encodeURIComponent(id)}/status`, token, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    return { ok: res.ok, message: json.message ?? "Failed to update status" };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

// ── Listing CRUD ───────────────────────────────────────────

export type CreateListingData = {
  title: string;
  listingType: "sale" | "rent" | "new";
  price: number;
  priceLabel?: string;
  region: string;
  location?: string;
  type: string;
  beds?: number;
  baths?: number;
  area?: number;
  description?: string;
  image?: string;
  imageLg?: string;
  gallery?: string[];
  amenities?: string[];
  furnishing?: string;
  parking?: string;
  latitude?: number;
  longitude?: number;
  floorPlans?: string[];
};

export async function createListing(
  data: CreateListingData
): Promise<{ ok: true; item: DashboardListing; message: string } | { ok: false; message: string }> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: "Not authenticated" };
  try {
    const res = await fetchEndpoint("/v1/agent/listings", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, message: json.message ?? "Failed to create listing" };
    return { ok: true, item: json.item, message: json.message };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

export async function fetchListingById(
  id: string
): Promise<DashboardListing | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetchEndpoint(`/v1/agent/listings/${encodeURIComponent(id)}`, token);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateListing(
  id: string,
  data: Partial<CreateListingData>
): Promise<{ ok: true; item: DashboardListing; message: string } | { ok: false; message: string }> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: "Not authenticated" };
  try {
    const res = await fetchEndpoint(`/v1/agent/listings/${encodeURIComponent(id)}`, token, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, message: json.message ?? "Failed to update listing" };
    return { ok: true, item: json.item, message: json.message };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

export async function deleteListing(
  id: string
): Promise<{ ok: boolean; message: string }> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: "Not authenticated" };
  try {
    const res = await fetchEndpoint(`/v1/agent/listings/${encodeURIComponent(id)}`, token, {
      method: "DELETE",
    });
    const json = await res.json();
    return { ok: res.ok, message: json.message ?? "Failed to delete listing" };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

// ── Upload ─────────────────────────────────────────────────

export type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

export type KycDocument = {
  type: "ghana_card" | "passport";
  url: string;
  name: string;
  uploadedAt: string;
};

export type VerificationData = {
  verificationStatus: VerificationStatus;
  kycDocuments: KycDocument[];
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
};

export async function fetchVerificationStatus(): Promise<VerificationData | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetchEndpoint("/v1/agent/verification", token);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function submitVerification(
  documents: Array<{ type: string; url: string; name: string }>
): Promise<{ ok: boolean; message: string }> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: "Not authenticated" };
  try {
    const res = await fetchEndpoint("/v1/agent/verification", token, {
      method: "POST",
      body: JSON.stringify({ documents }),
    });
    const json = await res.json();
    return { ok: res.ok, message: json.message ?? "Failed to submit" };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

