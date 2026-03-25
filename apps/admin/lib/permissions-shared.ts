/** Permission type shared between admin frontend and API (keep in sync with apps/api/src/lib/permissions.ts) */
export type Permission =
  | "stats.read"
  | "metrics.read"
  | "listings.read"
  | "listings.moderate"
  | "listings.featured"
  | "agents.read"
  | "agents.verify"
  | "users.read"
  | "inquiries.read"
  | "inquiries.update"
  | "admin_users.read"
  | "admin_users.create"
  | "admin_users.update"
  | "admin_users.deactivate"
  | "settings.read";
