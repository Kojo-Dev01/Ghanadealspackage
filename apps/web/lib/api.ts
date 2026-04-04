export type PropertyRecord = {
  id: string;
  title: string;
  listingType: "sale" | "rent" | "new";
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
  gallery?: string[];
  badges: string[];
  photos: number;
  description: string;
  amenities: string[];
  ref: string;
  added: string;
  furnishing: string;
  parking: string;
  agent: {
    id: string;
    name: string;
    company: string;
    phone: string;
    color: string;
  };
  latitude?: number;
  longitude?: number;
  floorPlans?: string[];
};

type PropertyListResponse = {
  items: PropertyRecord[];
  total: number;
  page: number;
  limit: number;
};

export type AgentRecord = {
  id: string;
  name: string;
  company: string;
  rating: number;
  reviewCount: number;
  areas: string[];
  listings: number;
  years: number;
  color: string;
  phone: string;
};

type AgentListResponse = {
  items: AgentRecord[];
  total: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

function toQueryString(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      qs.set(key, value);
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export type HomepageStats = {
  totalProperties: number;
  totalAgents: number;
  regions: { name: string; count: number }[];
  types: { name: string; count: number }[];
};

export async function fetchHomepageStats(): Promise<HomepageStats> {
  try {
    const response = await fetch(`${API_BASE}/properties/stats`, {
      cache: "no-store"
    });
    if (!response.ok) throw new Error("stats fetch failed");
    return (await response.json()) as HomepageStats;
  } catch {
    return { totalProperties: 0, totalAgents: 0, regions: [], types: [] };
  }
}

export async function fetchProperties(params: {
  listingType?: string;
  region?: string;
  type?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  minBaths?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  swLat?: string;
  swLng?: string;
  neLat?: string;
  neLng?: string;
} = {}): Promise<PropertyListResponse> {
  const query = toQueryString({
    listingType: params.listingType,
    region: params.region,
    type: params.type,
    q: params.q,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minBeds: params.minBeds,
    minBaths: params.minBaths,
    featured: params.featured ? "true" : undefined,
    page: params.page ? String(params.page) : undefined,
    limit: params.limit ? String(params.limit) : undefined,
    swLat: params.swLat,
    swLng: params.swLng,
    neLat: params.neLat,
    neLng: params.neLng,
  });

  try {
    const response = await fetch(`${API_BASE}/properties${query}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status}`);
    }
    return (await response.json()) as PropertyListResponse;
  } catch {
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 12
    };
  }
}

export async function fetchPropertyById(id: string): Promise<PropertyRecord | null> {
  try {
    const response = await fetch(`${API_BASE}/properties/${id}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PropertyRecord;
  } catch {
    return null;
  }
}

export async function fetchAgents(params: { q?: string; area?: string } = {}): Promise<AgentListResponse> {
  const query = toQueryString({
    q: params.q,
    area: params.area
  });

  try {
    const response = await fetch(`${API_BASE}/agents${query}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.status}`);
    }
    return (await response.json()) as AgentListResponse;
  } catch {
    return {
      items: [],
      total: 0
    };
  }
}

export async function submitInquiry(data: {
  propertyId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await response.json();
    if (!response.ok) {
      return { ok: false, message: json.message ?? "Failed to submit inquiry" };
    }
    return { ok: true, message: json.message ?? "Inquiry submitted" };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

export async function fetchAgentById(id: string): Promise<(AgentRecord & { verified?: boolean }) | null> {
  try {
    const response = await fetch(`${API_BASE}/agents/${id}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as AgentRecord & { verified?: boolean };
  } catch {
    return null;
  }
}

export async function fetchAgentListings(agentId: string): Promise<PropertyListResponse> {
  // Fetch all properties then filter by agent (API returns agent embedded)
  // For now, use a dedicated approach — the API properties endpoint doesn't support agent filter yet
  try {
    const response = await fetch(`${API_BASE}/agents/${agentId}/listings`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return { items: [], total: 0, page: 1, limit: 12 };
    }
    return (await response.json()) as PropertyListResponse;
  } catch {
    return { items: [], total: 0, page: 1, limit: 12 };
  }
}

// ── Auth ───────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "agent";
};

export type AgentProfile = {
  id: string;
  name: string;
  company: string;
  phone: string;
  verified: boolean;
  rating?: number;
  areas?: string[];
  years?: number;
  color?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  saved_properties: string[];
  search_preferences: Record<string, unknown>;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  agent: AgentProfile | null;
  profile: UserProfile | null;
};

export async function signupUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  accountType: "buyer" | "agent";
}): Promise<{ ok: true; data: AuthResponse } | { ok: false; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await response.json();
    if (!response.ok) {
      return { ok: false, message: json.message ?? "Signup failed" };
    }
    return { ok: true, data: json as AuthResponse };
  } catch {
    return { ok: false, message: "Network error — please try again" };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ ok: true; data: AuthResponse } | { ok: false; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const json = await response.json();
    if (!response.ok) {
      return { ok: false, message: json.message ?? "Login failed" };
    }
    return { ok: true, data: json as AuthResponse };
  } catch {
    return { ok: false, message: "Network error — please try again" };
  }
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const json = await response.json();
    return { ok: response.ok, message: json.message ?? "Something went wrong" };
  } catch {
    return { ok: false, message: "Network error — please try again" };
  }
}

export async function resetPassword(
  accessToken: string,
  refreshToken: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken, password })
    });
    const json = await response.json();
    return { ok: response.ok, message: json.message ?? "Something went wrong" };
  } catch {
    return { ok: false, message: "Network error — please try again" };
  }
}

export async function fetchMe(
  token: string
): Promise<{ user: AuthUser; agent: AgentProfile | null; profile: UserProfile | null } | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { authorization: `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ── Agent Dashboard ────────────────────────────────────────

function authHeaders(token: string) {
  return { authorization: `Bearer ${token}`, "content-type": "application/json" };
}

export type DashboardStats = {
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  totalInquiries: number;
  newInquiries: number;
};

export type DashboardListing = PropertyRecord & {
  moderationStatus: string;
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

export async function fetchDashboardStats(token: string): Promise<DashboardStats | null> {
  try {
    const res = await fetch(`${API_BASE}/agent/stats`, { headers: authHeaders(token) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function fetchDashboardProfile(token: string): Promise<AgentProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/agent/profile`, { headers: authHeaders(token) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function updateDashboardProfile(
  token: string,
  data: Partial<{ name: string; company: string; phone: string; color: string; areas: string[]; years: number }>
): Promise<AgentProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/agent/profile`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(data)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function fetchDashboardListings(
  token: string,
  params?: { status?: string; page?: number }
): Promise<{ items: DashboardListing[]; total: number; page: number; limit: number }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  try {
    const res = await fetch(`${API_BASE}/agent/listings?${sp}`, { headers: authHeaders(token) });
    if (!res.ok) return { items: [], total: 0, page: 1, limit: 12 };
    return await res.json();
  } catch { return { items: [], total: 0, page: 1, limit: 12 }; }
}

export async function fetchDashboardInquiries(
  token: string,
  params?: { status?: string; page?: number }
): Promise<{ items: DashboardInquiry[]; total: number; page: number; limit: number }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  try {
    const res = await fetch(`${API_BASE}/agent/inquiries?${sp}`, { headers: authHeaders(token) });
    if (!res.ok) return { items: [], total: 0, page: 1, limit: 20 };
    return await res.json();
  } catch { return { items: [], total: 0, page: 1, limit: 20 }; }
}

// ── Buyer Account ──────────────────────────────────────────

export async function fetchBuyerProfile(token: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/buyer/profile`, { headers: authHeaders(token) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function updateBuyerProfile(
  token: string,
  data: Partial<{ name: string; phone: string }>
): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/buyer/profile`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(data)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export type SavedPropertyItem = {
  id: string;
  title: string;
  listingType: string;
  price: number;
  priceFormatted: string;
  region: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  agentName: string;
};

export async function fetchSavedProperties(token: string): Promise<{ items: SavedPropertyItem[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/buyer/saved`, { headers: authHeaders(token) });
    if (!res.ok) return { items: [], total: 0 };
    return await res.json();
  } catch { return { items: [], total: 0 }; }
}

export async function saveProperty(token: string, propertyId: string): Promise<boolean> {
  try {
    const url = `${API_BASE}/buyer/saved/${propertyId}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { return false; }
}

export async function unsaveProperty(token: string, propertyId: string): Promise<boolean> {
  try {
    const url = `${API_BASE}/buyer/saved/${propertyId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { return false; }
}

// ── Notifications ─────────────────────────────────────────────

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export async function fetchNotifications(
  token: string,
  params: { page?: number; limit?: number; unread?: boolean } = {}
): Promise<{ items: NotificationItem[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.unread) qs.set("unread", "true");
  const res = await fetch(`${API_BASE}/notifications?${qs}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { items: [], total: 0, page: 1, limit: 20 };
  return res.json();
}

export async function fetchUnreadCount(token: string): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  } catch { return 0; }
}

export async function markNotificationRead(token: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { return false; }
}

export async function markAllNotificationsRead(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { return false; }
}

export async function deleteNotification(token: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { return false; }
}

// ── Agent Reviews ──────────────────────────────────────────

export type ReviewRecord = {
  id: string;
  agentId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewListResponse = {
  items: ReviewRecord[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchAgentReviews(agentId: string, page = 1): Promise<ReviewListResponse> {
  try {
    const response = await fetch(`${API_BASE}/agents/${agentId}/reviews?page=${page}`, {
      cache: "no-store",
    });
    if (!response.ok) return { items: [], total: 0, page: 1, limit: 20 };
    return (await response.json()) as ReviewListResponse;
  } catch {
    return { items: [], total: 0, page: 1, limit: 20 };
  }
}

export async function submitAgentReview(
  token: string,
  agentId: string,
  data: { rating: number; comment?: string }
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/agents/${agentId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, message: json.message ?? "Failed to submit review" };
    return { ok: true, message: json.message ?? "Review submitted" };
  } catch {
    return { ok: false, message: "Network error" };
  }
}
