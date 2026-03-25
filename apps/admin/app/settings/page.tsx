import { AdminShell } from "@/components/admin-shell";
import { fetchAdminStats } from "@/lib/api";
import {
  Globe,
  Shield,
  Database,
  Cloud,
  Server,
  Lock,
  Info,
} from "lucide-react";

function SettingCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <dt className="text-sm font-medium text-foreground w-44 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-text-secondary flex-1 min-w-0 break-all">
        {value}
        {hint && (
          <span className="block text-xs text-muted mt-0.5">{hint}</span>
        )}
      </dd>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const stats = await fetchAdminStats();

  const supabaseUrl = process.env.SUPABASE_URL ?? "—";
  const supabaseRef = supabaseUrl.includes("supabase.co")
    ? supabaseUrl.replace("https://", "").replace(".supabase.co", "")
    : "—";
  const apiPort = process.env.API_PORT ?? "4000";
  const corsOrigins = process.env.CORS_ORIGINS ?? "—";
  const adminRoles = process.env.ADMIN_ALLOWED_ROLES ?? "admin";
  const wasabiBucket = process.env.WASABI_BUCKET ?? "—";
  const wasabiRegion = process.env.WASABI_REGION ?? "—";
  const wasabiEndpoint = process.env.WASABI_ENDPOINT ?? "—";

  return (
    <AdminShell
      activeNav="settings"
      eyebrow="Configuration"
      title="Settings"
      description="Platform configuration and environment overview."
    >
      <div className="space-y-6">
        {/* General */}
        <SettingCard
          title="General"
          description="Platform identity and public information"
          icon={<Globe size={16} />}
        >
          <dl className="space-y-3">
            <SettingRow label="Platform Name" value="GhanaDeals" />
            <SettingRow
              label="Description"
              value="Ghana's Premier Property Marketplace"
            />
            <SettingRow label="Public URL" value="http://localhost:3000" hint="Web-facing marketplace" />
            <SettingRow label="Admin URL" value="http://localhost:3001" hint="This admin panel" />
            <SettingRow label="Agent Portal" value="http://localhost:3002" />
            <SettingRow label="Support Phone" value="+233 30 212 3456" />
          </dl>
        </SettingCard>

        {/* Access & Moderation */}
        <SettingCard
          title="Access & Moderation"
          description="Roles and moderation policies"
          icon={<Shield size={16} />}
        >
          <dl className="space-y-3">
            <SettingRow
              label="Admin Roles"
              value={adminRoles}
              hint="Comma-separated list of roles allowed to access admin panel"
            />
            <SettingRow label="CORS Origins" value={corsOrigins} hint="Allowed cross-origin origins for the API" />
            <SettingRow
              label="Moderation Flow"
              value="Manual review"
              hint="New agent listings require admin approval before going live"
            />
            <SettingRow
              label="Listing Statuses"
              value="pending → approved / flagged / archived"
            />
            <SettingRow
              label="Inquiry Statuses"
              value="new → read → responded → closed"
            />
          </dl>
        </SettingCard>

        {/* Database */}
        <SettingCard
          title="Database"
          description="Supabase project connection"
          icon={<Database size={16} />}
        >
          <dl className="space-y-3">
            <SettingRow label="Provider" value="Supabase (PostgreSQL)" />
            <SettingRow label="Project Ref" value={supabaseRef} />
            <SettingRow label="URL" value={supabaseUrl} />
            <SettingRow
              label="Service Role Key"
              value="••••••••••••••••"
              hint="Stored in .env — never exposed to client"
            />
            <SettingRow
              label="RLS"
              value="Enabled"
              hint="Row-Level Security active on all tables"
            />
          </dl>
          {stats && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Current Counts
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Listings", value: stats.totals.listings },
                  { label: "Agents", value: stats.totals.agents },
                  { label: "Inquiries", value: stats.totals.inquiries },
                  { label: "Pending", value: stats.totals.pending },
                  { label: "Approved", value: stats.totals.approved },
                  { label: "Flagged", value: stats.totals.flagged },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-background rounded-lg px-3 py-2 border border-border"
                  >
                    <p className="text-xs text-muted">{s.label}</p>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SettingCard>

        {/* API */}
        <SettingCard
          title="API Server"
          description="Fastify backend configuration"
          icon={<Server size={16} />}
        >
          <dl className="space-y-3">
            <SettingRow label="Framework" value="Fastify 5" />
            <SettingRow label="Port" value={apiPort} />
            <SettingRow label="Base URL" value={`http://localhost:${apiPort}/v1`} />
            <SettingRow
              label="JWT Secret"
              value="••••••••••••••••"
              hint="Stored in .env — used for auth token signing"
            />
            <SettingRow label="Auth" value="JWT Bearer tokens via @fastify/jwt" />
          </dl>
        </SettingCard>

        {/* Cloud Storage */}
        <SettingCard
          title="Cloud Storage"
          description="Wasabi S3-compatible object storage"
          icon={<Cloud size={16} />}
        >
          <dl className="space-y-3">
            <SettingRow label="Provider" value="Wasabi" />
            <SettingRow label="Bucket" value={wasabiBucket} />
            <SettingRow label="Region" value={wasabiRegion} />
            <SettingRow label="Endpoint" value={wasabiEndpoint} />
            <SettingRow
              label="Access Key"
              value="••••••••••••••••"
              hint="Stored in .env"
            />
          </dl>
        </SettingCard>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl px-5 py-4">
          <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Environment-based Configuration</p>
            <p className="text-xs mt-1 opacity-80">
              Settings are configured via environment variables in <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-[11px]">.env</code>. 
              Changes require an application restart to take effect.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
