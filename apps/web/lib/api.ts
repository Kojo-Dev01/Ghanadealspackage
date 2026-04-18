export type PropertyRecord = {
  id: string;
  title: string;
  listingType: "sale" | "rent" | "new" | "land" | "uncompleted";
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
    avatar_url?: string | null;
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
  userId: string | null;
  name: string;
  company: string;
  rating: number;
  reviewCount: number;
  areas: string[];
  listings: number;
  years: number;
  color: string;
  phone: string;
  avatar_url?: string | null;
  verified?: boolean;
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

// ── Buyer Enquiries ────────────────────────────────────────

export type BuyerEnquiryItem = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyRegion: string;
  propertyType: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
};

type BuyerEnquiriesResponse = {
  items: BuyerEnquiryItem[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchBuyerEnquiries(
  page = 1,
  status?: string
): Promise<BuyerEnquiriesResponse> {
  try {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    const res = await authFetch(`/buyer/inquiries?${params}`);
    if (!res.ok) return { items: [], total: 0, page: 1, limit: 20 };
    return (await res.json()) as BuyerEnquiriesResponse;
  } catch {
    return { items: [], total: 0, page: 1, limit: 20 };
  }
}

// ── Buyer → Seller Upgrade ─────────────────────────────────

export async function upgradeToSeller(data: {
  company?: string;
  phone?: string;
  areas?: string[];
}): Promise<{ ok: boolean; message: string; data?: { user: AuthUser; agent: AgentProfile } }> {
  try {
    const res = await fetch("/api/auth/upgrade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      credentials: "same-origin",
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, message: json.message ?? "Upgrade failed" };
    }
    return { ok: true, message: "Account upgraded successfully", data: json.data };
  } catch {
    return { ok: false, message: "Network error — please try again" };
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

// ── Authenticated fetch (via httpOnly cookie proxy) ────────

function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api/v1${path}`, { ...init, credentials: "same-origin" });
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

export async function fetchBuyerProfile(): Promise<UserProfile | null> {
  try {
    const res = await authFetch("/buyer/profile");
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function updateBuyerProfile(
  data: Partial<{ name: string; phone: string }>
): Promise<UserProfile | null> {
  try {
    const res = await authFetch("/buyer/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
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

export async function fetchSavedProperties(): Promise<{ items: SavedPropertyItem[]; total: number }> {
  try {
    const res = await authFetch("/buyer/saved");
    if (!res.ok) return { items: [], total: 0 };
    return await res.json();
  } catch { return { items: [], total: 0 }; }
}

export async function saveProperty(propertyId: string): Promise<boolean> {
  try {
    const res = await authFetch(`/buyer/saved/${propertyId}`, { method: "POST" });
    return res.ok;
  } catch { return false; }
}

export async function unsaveProperty(propertyId: string): Promise<boolean> {
  try {
    const res = await authFetch(`/buyer/saved/${propertyId}`, { method: "DELETE" });
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
  params: { page?: number; limit?: number; unread?: boolean } = {}
): Promise<{ items: NotificationItem[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.unread) qs.set("unread", "true");
  const res = await authFetch(`/notifications?${qs}`);
  if (!res.ok) return { items: [], total: 0, page: 1, limit: 20 };
  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await authFetch("/notifications/unread-count");
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  } catch { return 0; }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    const res = await authFetch(`/notifications/${id}/read`, { method: "PUT" });
    return res.ok;
  } catch { return false; }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const res = await authFetch("/notifications/read-all", { method: "PUT" });
    return res.ok;
  } catch { return false; }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const res = await authFetch(`/notifications/${id}`, { method: "DELETE" });
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
  agentId: string,
  data: { rating: number; comment?: string }
): Promise<{ ok: boolean; message: string; item?: ReviewRecord }> {
  try {
    const res = await authFetch(`/agents/${agentId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, message: json.message ?? "Failed to submit review" };
    return { ok: true, message: json.message ?? "Review submitted", item: json.item };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

// ── Conversations / Chat ─────────────────────────────────

export type ConversationListItem = {
  id: string;
  propertyId: string | null;
  property: { id: string; title: string; image: string | null } | null;
  otherUser: { user_id: string; name: string; email: string; avatar_url: string | null } | null;
  lastMessage: { id: string; content: string; message_type: string; sender_id: string; created_at: string } | null;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  propertyId: string | null;
  buyerId: string;
  sellerId: string;
  property: { id: string; title: string; image: string; gallery: string[]; price: number; location: string } | null;
  buyer: { user_id: string; name: string; email: string; avatar_url: string | null } | null;
  seller: { user_id: string; name: string; email: string; avatar_url: string | null } | null;
  lastMessageAt: string;
  createdAt: string;
};

export type PropertyRefData = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  location: string;
  listingType: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachment_url: string | null;
  attachment_name: string | null;
  property_ref_id: string | null;
  property_ref: PropertyRefData | null;
  read_at: string | null;
  created_at: string;
  deleted_at: string | null;
};

export async function fetchConversations(): Promise<ConversationListItem[]> {
  try {
    const res = await authFetch("/conversations");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchConversation(id: string): Promise<ConversationDetail | null> {
  try {
    const res = await authFetch(`/conversations/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  try {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const res = await authFetch(`/conversations/${conversationId}/messages?${params}`);
    if (!res.ok) return { messages: [], hasMore: false };
    return await res.json();
  } catch {
    return { messages: [], hasMore: false };
  }
}

export async function sendMessage(
  conversationId: string,
  content: string,
  messageType = "text",
  opts?: { attachmentUrl?: string; attachmentName?: string; propertyRefId?: string }
): Promise<ChatMessage | null> {
  try {
    const res = await authFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        messageType,
        ...(opts?.attachmentUrl && { attachmentUrl: opts.attachmentUrl }),
        ...(opts?.attachmentName && { attachmentName: opts.attachmentName }),
        ...(opts?.propertyRefId && { propertyRefId: opts.propertyRefId }),
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function markConversationRead(conversationId: string): Promise<void> {
  try {
    await authFetch(`/conversations/${conversationId}/read`, { method: "PATCH" });
  } catch {
    // silent
  }
}

export async function startConversation(
  propertyId: string,
  sellerId: string,
  message: string
): Promise<{ conversationId: string } | null> {
  try {
    const payload: Record<string, string> = {};
    if (message) payload.message = message;
    if (propertyId) payload.propertyId = propertyId;
    if (sellerId) payload.sellerId = sellerId;
    const res = await authFetch("/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchUnreadConversationCount(): Promise<number> {
  try {
    const res = await authFetch("/conversations/unread-count");
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

export async function uploadChatImage(file: File): Promise<{ url: string; key: string } | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload-chat-image", { method: "POST", body: form, credentials: "same-origin" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSellerProperties(
  conversationId: string
): Promise<{ id: string; title: string; image: string | null; price: number; location: string; listingType: string }[]> {
  try {
    const res = await authFetch(`/conversations/${conversationId}/seller-properties`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
