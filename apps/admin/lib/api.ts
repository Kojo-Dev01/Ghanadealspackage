import { cookies } from "next/headers";

// ---- Types ----

type AdminStatsResponse = {
  totals: {
    listings: number;
    pending: number;
    approved: number;
    flagged: number;
    agents: number;
    verifiedAgents: number;
    inquiries: number;
    buyers: number;
    newBuyersThisWeek: number;
  };
  recentActivity: Array<{ time: string; item: string }>;
};

export type AdminMetricsResponse = {
  listings: {
    total: number;
    approved: number;
    pending: number;
    flagged: number;
    newThisWeek: number;
    newThisMonth: number;
    byType: Array<{ name: string; count: number }>;
    byRegion: Array<{ name: string; count: number }>;
    trend: Array<{ date: string; count: number }>;
  };
  agents: {
    total: number;
    verified: number;
    newThisWeek: number;
  };
  buyers: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    trend: Array<{ date: string; count: number }>;
  };
  inquiries: {
    total: number;
    newThisWeek: number;
    responded: number;
    responseRate: number;
    trend: Array<{ date: string; count: number }>;
    recent: Array<{ id: string; name: string; email: string; status: string; createdAt: string }>;
  };
};

type AdminLoginResponse = {
  token: string;
  user: { id: string; email: string | null; role: string };
};

type AdminLoginResult =
  | { ok: true; data: AdminLoginResponse }
  | { ok: false; reason: "invalid" | "config" | "forbidden" };

export type AdminListing = {
  id: string;
  title: string;
  listingType: "sale" | "rent";
  region: string;
  location: string;
  type: string;
  price: number;
  priceFormatted: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  submittedAt: string;
  moderationStatus: "pending" | "approved" | "flagged";
  moderationReason: string | null;
  agentName: string;
};

export type AdminListingStatus = AdminListing["moderationStatus"];

export type AdminListingDetail = {
  id: string;
  title: string;
  listingType: string;
  price: number;
  priceFormatted: string;
  priceLabel: string | null;
  region: string;
  location: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  description: string;
  image: string;
  imageLg: string | null;
  gallery: string[];
  amenities: string[];
  ref: string;
  furnishing: string;
  parking: string;
  latitude: number | null;
  longitude: number | null;
  floorPlans: string[];
  featured: boolean;
  moderationStatus: AdminListingStatus;
  moderationReason: string | null;
  moderatedAt: string | null;
  submittedAt: string;
  agent: {
    id: string;
    name: string;
    company: string;
    phone: string;
    color: string;
  };
};

type AdminListingsResponse = {
  items: AdminListing[];
  total: number;
  page: number;
  limit: number;
};

export type InquiryStatus = "new" | "read" | "responded" | "closed";

export type AdminInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  property: { id: string; title: string };
};

type AdminInquiriesResponse = {
  items: AdminInquiry[];
  total: number;
  page: number;
  limit: number;
};

// ---- Helpers ----

function apiBase() {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:4000"
  );
}

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("gd_admin_session")?.value;
}

async function apiFetch(path: string, token?: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  }).catch(() => null);
}

// ---- Auth ----

export async function loginAdmin(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const res = await apiFetch("/v1/admin/auth/login", undefined, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res) return { ok: false, reason: "invalid" };
  if (res.status === 503) return { ok: false, reason: "config" };
  if (res.status === 403) return { ok: false, reason: "forbidden" };
  if (!res.ok) return { ok: false, reason: "invalid" };

  const data = (await res.json()) as AdminLoginResponse;
  return { ok: true, data };
}

// ---- Stats ----

export async function fetchAdminStats(): Promise<AdminStatsResponse | null> {
  const token = await getToken();
  const res = await apiFetch("/v1/admin/stats", token);
  if (!res?.ok) return null;
  return res.json() as Promise<AdminStatsResponse>;
}

export async function fetchAdminMetrics(): Promise<AdminMetricsResponse | null> {
  const token = await getToken();
  const res = await apiFetch("/v1/admin/metrics", token);
  if (!res?.ok) return null;
  return res.json() as Promise<AdminMetricsResponse>;
}

// ---- Listings ----

export async function fetchAdminListings(params?: {
  status?: AdminListingStatus;
  listingType?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<AdminListingsResponse | null> {
  const token = await getToken();
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.listingType) sp.set("listing_type", params.listingType);
  if (params?.q) sp.set("q", params.q);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await apiFetch(`/v1/admin/listings${q ? `?${q}` : ""}`, token);
  if (!res?.ok) return null;
  return res.json() as Promise<AdminListingsResponse>;
}

export async function fetchAdminListingById(
  id: string
): Promise<AdminListingDetail | null> {
  const token = await getToken();
  const res = await apiFetch(`/v1/admin/listings/${encodeURIComponent(id)}`, token);
  if (!res?.ok) return null;
  const payload = (await res.json()) as { item: AdminListingDetail };
  return payload.item;
}

export async function moderateAdminListing(
  listingId: string,
  moderationStatus: AdminListingStatus,
  reason?: string
): Promise<AdminListing | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await apiFetch(
    `/v1/admin/listings/${listingId}/moderate`,
    token,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: moderationStatus, reason }),
    }
  );
  if (!res?.ok) return null;
  const payload = (await res.json()) as { item: AdminListing };
  return payload.item;
}

export async function toggleAdminListingFeatured(
  listingId: string
): Promise<{ featured: boolean; message: string } | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await apiFetch(
    `/v1/admin/listings/${listingId}/featured`,
    token,
    { method: "POST" }
  );
  if (!res?.ok) return null;
  return (await res.json()) as { featured: boolean; message: string };
}

export async function deleteAdminListing(
  listingId: string
): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const res = await apiFetch(
    `/v1/admin/listings/${encodeURIComponent(listingId)}`,
    token,
    { method: "DELETE" }
  );
  return !!res?.ok;
}

// ---- Inquiries ----

export async function fetchAdminInquiries(params?: {
  status?: InquiryStatus;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<AdminInquiriesResponse | null> {
  const token = await getToken();
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.q) sp.set("q", params.q);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await apiFetch(`/v1/admin/inquiries${q ? `?${q}` : ""}`, token);
  if (!res?.ok) return null;
  return res.json() as Promise<AdminInquiriesResponse>;
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus
): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const res = await apiFetch(
    `/v1/admin/inquiries/${inquiryId}/status`,
    token,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
  return !!res?.ok;
}

// ---- Agents ----

export type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

export type KycDocument = {
  type: string;
  url: string;
  name: string;
  uploadedAt: string;
};

export type AdminAgent = {
  id: string;
  name: string;
  company: string;
  rating: number;
  areas: string[];
  listings: number;
  years: number;
  color: string;
  avatarUrl: string | null;
  phone: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  kycDocuments: KycDocument[];
  selfieUrl: string | null;
  verificationSubmittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

type AdminAgentsResponse = {
  items: AdminAgent[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchAdminAgents(params?: {
  q?: string;
  area?: string;
  verification?: VerificationStatus;
  page?: number;
  limit?: number;
}): Promise<AdminAgentsResponse | null> {
  const token = await getToken();
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.area) sp.set("area", params.area);
  if (params?.verification) sp.set("verification", params.verification);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await apiFetch(`/v1/admin/agents${q ? `?${q}` : ""}`, token ?? undefined);
  if (!res?.ok) return null;
  return res.json() as Promise<AdminAgentsResponse>;
}

export async function verifyAgent(
  agentId: string,
  action: "approve" | "reject",
  reason?: string
): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const res = await apiFetch(
    `/v1/admin/agents/${encodeURIComponent(agentId)}/verify`,
    token,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, reason }),
    }
  );
  return !!res?.ok;
}

export type AdminAgentDetail = AdminAgent & {
  verifiedBy: string | null;
  listings: Array<{
    id: string;
    title: string;
    listingType: string;
    price: number;
    priceFormatted: string;
    region: string;
    location: string;
    type: string;
    beds: number;
    baths: number;
    area: number;
    image: string;
    moderationStatus: string;
    moderationReason: string | null;
    submittedAt: string;
  }>;
};

export async function fetchAdminAgentById(
  id: string
): Promise<AdminAgentDetail | null> {
  const token = await getToken();
  const res = await apiFetch(
    `/v1/admin/agents/${encodeURIComponent(id)}`,
    token ?? undefined
  );
  if (!res?.ok) return null;
  const payload = (await res.json()) as { item: AdminAgentDetail };
  return payload.item;
}

// ---- Users ----

export type AdminUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  savedCount: number;
  role: "agent" | "buyer";
  suspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminUsersResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  stats: {
    total: number;
    agents: number;
    buyers: number;
    suspended: number;
    newThisWeek: number;
  };
};

export async function fetchAdminUsers(params?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse | null> {
  const token = await getToken();
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await apiFetch(`/v1/admin/users${q ? `?${q}` : ""}`, token);
  if (!res?.ok) return null;
  return res.json() as Promise<AdminUsersResponse>;
}

export async function suspendUser(id: string, reason?: string): Promise<boolean> {
  const token = await getToken();
  const res = await apiFetch(`/v1/admin/users/${id}/suspend`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return res?.ok ?? false;
}

export async function unsuspendUser(id: string): Promise<boolean> {
  const token = await getToken();
  const res = await apiFetch(`/v1/admin/users/${id}/unsuspend`, token, {
    method: "PATCH",
  });
  return res?.ok ?? false;
}

export async function deleteUser(id: string): Promise<boolean> {
  const token = await getToken();
  const res = await apiFetch(`/v1/admin/users/${id}`, token, {
    method: "DELETE",
  });
  return res?.ok ?? false;
}

// ---- Admin Team (RBAC) ----

export type AdminRole = "super_admin" | "moderator" | "customer_service";

export type AdminTeamMember = {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type AdminTeamResponse = {
  items: AdminTeamMember[];
};

export type AdminMe = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
};

export async function fetchAdminMe(): Promise<AdminMe | null> {
  const token = await getToken();
  const res = await apiFetch("/v1/admin/me", token);
  if (!res?.ok) return null;
  const payload = (await res.json()) as { user: AdminMe };
  return payload.user;
}

export async function updateAdminMe(
  body: { name?: string; currentPassword?: string; newPassword?: string }
): Promise<{ ok: true; user: AdminMe } | { ok: false; message: string }> {
  const token = await getToken();
  const res = await apiFetch("/v1/admin/me", token, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res) return { ok: false, message: "Network error" };
  const payload = await res.json() as any;
  if (!res.ok) return { ok: false, message: payload.message ?? "Update failed" };
  return { ok: true, user: payload.user };
}

export async function fetchAdminTeam(): Promise<AdminTeamMember[] | null> {
  const token = await getToken();
  const res = await apiFetch("/v1/admin/team", token);
  if (!res?.ok) return null;
  const payload = (await res.json()) as AdminTeamResponse;
  return payload.items;
}

export async function createAdminTeamMember(data: {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}): Promise<{ ok: true; item: AdminTeamMember } | { ok: false; message: string }> {
  const token = await getToken();
  if (!token) return { ok: false, message: "Not authenticated" };
  const res = await apiFetch("/v1/admin/team", token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res) return { ok: false, message: "Network error" };
  const body = await res.json() as any;
  if (!res.ok) return { ok: false, message: body.message ?? "Failed" };
  return { ok: true, item: body.item };
}

export async function updateAdminTeamMember(
  id: string,
  data: { role?: AdminRole; name?: string }
): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const res = await apiFetch(`/v1/admin/team/${encodeURIComponent(id)}`, token, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return !!res?.ok;
}

export async function toggleAdminTeamMemberActive(id: string): Promise<{ ok: boolean; active?: boolean; message?: string }> {
  const token = await getToken();
  if (!token) return { ok: false, message: "Not authenticated" };
  const res = await apiFetch(`/v1/admin/team/${encodeURIComponent(id)}/deactivate`, token, {
    method: "POST",
  });
  if (!res) return { ok: false, message: "Network error" };
  const body = await res.json() as any;
  if (!res.ok) return { ok: false, message: body.message };
  return { ok: true, active: body.item?.active, message: body.message };
}

// ---- Conversations / Chats ----

export type AdminConversationUser = {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export type AdminConversationListItem = {
  id: string;
  propertyId: string | null;
  property: { id: string; title: string; image: string | null } | null;
  buyer: AdminConversationUser | null;
  seller: AdminConversationUser | null;
  lastMessage: { content: string; message_type: string; sender_id: string; created_at: string } | null;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
};

export type AdminConversationDetail = {
  id: string;
  propertyId: string | null;
  buyerId: string;
  sellerId: string;
  property: { id: string; title: string; image: string | null; price: number; location: string } | null;
  buyer: AdminConversationUser | null;
  seller: AdminConversationUser | null;
  lastMessageAt: string;
  createdAt: string;
};

export type AdminChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachment_url: string | null;
  attachment_name: string | null;
  property_ref_id: string | null;
  property_ref: { id: string; title: string; image: string | null; price: number; location: string; listingType: string } | null;
  read_at: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
};

type AdminConversationsResponse = {
  items: AdminConversationListItem[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchAdminConversations(params?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<AdminConversationsResponse | null> {
  const token = await getToken();
  if (!token) return null;
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await apiFetch(`/v1/admin/conversations${q ? `?${q}` : ""}`, token);
  if (!res?.ok) return null;
  return res.json();
}

export async function fetchAdminConversation(id: string): Promise<AdminConversationDetail | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await apiFetch(`/v1/admin/conversations/${encodeURIComponent(id)}`, token);
  if (!res?.ok) return null;
  return res.json();
}

export async function fetchAdminConversationMessages(id: string, cursor?: string): Promise<{ messages: AdminChatMessage[]; hasMore: boolean } | null> {
  const token = await getToken();
  if (!token) return null;
  const sp = new URLSearchParams();
  if (cursor) sp.set("cursor", cursor);
  const q = sp.toString();
  const res = await apiFetch(`/v1/admin/conversations/${encodeURIComponent(id)}/messages${q ? `?${q}` : ""}`, token);
  if (!res?.ok) return null;
  return res.json();
}

export async function deleteAdminMessage(conversationId: string, messageId: string): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const res = await apiFetch(
    `/v1/admin/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
    token,
    { method: "DELETE" }
  );
  return res?.ok ?? false;
}
