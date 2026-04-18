/**
 * Admin role-based access control (RBAC).
 *
 * Roles (ordered by privilege):
 *   super_admin      — Full access. Can manage admin users and all data.
 *   moderator        — Listings, agents, featured. Read-only metrics.
 *   customer_service — Inquiries, users (buyers). Read-only metrics.
 *
 * Permissions are checked server-side on every request; the JWT carries
 * the user ID but the role is always read fresh from the `admin_users`
 * table so that role changes / deactivations take effect immediately.
 */

export type AdminRole = "super_admin" | "moderator" | "customer_service";

export type Permission =
  | "stats.read"
  | "metrics.read"
  | "listings.read"
  | "listings.moderate"
  | "listings.featured"
  | "listings.delete"
  | "agents.read"
  | "agents.verify"
  | "users.read"
  | "users.update"
  | "users.delete"
  | "inquiries.read"
  | "inquiries.update"
  | "admin_users.read"
  | "admin_users.create"
  | "admin_users.update"
  | "admin_users.deactivate"
  | "settings.read";

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  super_admin: new Set<Permission>([
    "stats.read",
    "metrics.read",
    "listings.read",
    "listings.moderate",
    "listings.featured",
    "listings.delete",
    "agents.read",
    "agents.verify",
    "users.read",
    "inquiries.read",
    "inquiries.update",
    "admin_users.read",
    "admin_users.create",
    "admin_users.update",
    "admin_users.deactivate",
    "settings.read",
  ]),

  moderator: new Set<Permission>([
    "stats.read",
    "metrics.read",
    "listings.read",
    "listings.moderate",
    "listings.featured",
    "listings.delete",
    "agents.read",
    "agents.verify",
  ]),

  customer_service: new Set<Permission>([
    "stats.read",
    "metrics.read",
    "users.read",
    "users.update",
    "inquiries.read",
    "inquiries.update",
  ]),
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function getPermissions(role: AdminRole): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[role] ?? new Set();
}

/** All valid admin roles (for Zod validation). */
export const ADMIN_ROLES: AdminRole[] = ["super_admin", "moderator", "customer_service"];

/** Human-readable labels for admin roles. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  moderator: "Moderator",
  customer_service: "Customer Service",
};
