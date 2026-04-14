import { AdminShell } from "@/components/admin-shell";
import { FormButton } from "@/components/form-button";
import { fetchAdminTeam, fetchAdminMe, createAdminTeamMember, toggleAdminTeamMemberActive, updateAdminTeamMember } from "@/lib/api";
import type { AdminRole } from "@/lib/api";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ShieldCheck, UserPlus, Ban, RotateCcw, Pencil } from "lucide-react";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  moderator: "Moderator",
  customer_service: "Customer Service",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "bg-red-500/10 text-red-600 border-red-200",
  moderator: "bg-blue-500/10 text-blue-600 border-blue-200",
  customer_service: "bg-green-500/10 text-green-600 border-green-200",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const [team, me] = await Promise.all([fetchAdminTeam(), fetchAdminMe()]);

  if (!me) redirect("/login");

  const canCreate = me.role === "super_admin";
  const canDeactivate = me.role === "super_admin";
  const canUpdateRole = me.role === "super_admin";

  async function inviteAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const role = String(formData.get("role") ?? "customer_service") as AdminRole;

    if (!email || !name || !password) {
      redirect("/team?error=All+fields+are+required");
    }

    if (password.length < 8) {
      redirect("/team?error=Password+must+be+at+least+8+characters");
    }

    const result = await createAdminTeamMember({ email, name, password, role });
    if (!result.ok) {
      redirect(`/team?error=${encodeURIComponent(result.message)}`);
    }

    revalidatePath("/team");
    redirect("/team?success=Admin+user+created+successfully");
  }

  async function toggleActiveAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const result = await toggleAdminTeamMemberActive(id);
    if (!result.ok) {
      redirect(`/team?error=${encodeURIComponent(result.message ?? "Failed")}`);
    }

    revalidatePath("/team");
    redirect(`/team?success=${encodeURIComponent(result.message ?? "Updated")}`);
  }

  async function updateRoleAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const role = String(formData.get("role") ?? "") as AdminRole;
    if (!id || !role) return;

    const ok = await updateAdminTeamMember(id, { role });
    if (!ok) {
      redirect("/team?error=Failed+to+update+role");
    }

    revalidatePath("/team");
    redirect("/team?success=Role+updated+successfully");
  }

  return (
    <AdminShell
      eyebrow="Administration"
      title="Team Management"
      description="Manage admin users and their roles."
    >
      {params.error && (
        <p className="px-4 py-2.5 bg-red-500/10 text-red-600 text-sm font-medium rounded-lg">
          {params.error}
        </p>
      )}
      {params.success && (
        <p className="px-4 py-2.5 bg-green-500/10 text-green-600 text-sm font-medium rounded-lg">
          {params.success}
        </p>
      )}

      {/* Team list */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <h2 className="font-semibold text-foreground">Admin Users</h2>
            <span className="text-xs text-muted ml-1">({team?.length ?? 0})</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {(team ?? []).map((member) => (
            <div
              key={member.id}
              className={`px-5 py-4 flex flex-wrap items-center gap-4 ${
                !member.active ? "opacity-50" : ""
              }`}
            >
              {/* Info */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground text-sm">
                    {member.name || member.email}
                  </p>
                  {member.id === me.id && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                  {!member.active && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                      Deactivated
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">{member.email}</p>
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-2">
                {canUpdateRole && member.id !== me.id ? (
                  <form action={updateRoleAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="text-xs border border-border rounded-md bg-panel-alt px-2 py-1.5 text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="customer_service">Customer Service</option>
                    </select>
                    <FormButton
                      type="submit"
                      className="p-1 rounded hover:bg-accent/10 text-accent transition-colors cursor-pointer"
                      title="Update role"
                    >
                      <Pencil size={14} />
                    </FormButton>
                  </form>
                ) : (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      ROLE_COLORS[member.role] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                )}
              </div>

              {/* Joined */}
              <p className="text-xs text-muted w-[130px]">
                Joined {new Date(member.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              {/* Actions */}
              {canDeactivate && member.id !== me.id && (
                <form action={toggleActiveAction}>
                  <input type="hidden" name="id" value={member.id} />
                  <FormButton
                    type="submit"
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      member.active
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-green-200 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {member.active ? (
                      <>
                        <Ban size={13} /> Deactivate
                      </>
                    ) : (
                      <>
                        <RotateCcw size={13} /> Reactivate
                      </>
                    )}
                  </FormButton>
                </form>
              )}
            </div>
          ))}

          {(!team || team.length === 0) && (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No admin users found.
            </p>
          )}
        </div>
      </div>

      {/* Invite form */}
      {canCreate && (
        <div className="bg-panel border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <UserPlus size={18} className="text-accent" />
            <h2 className="font-semibold text-foreground">Add Admin User</h2>
          </div>

          <form action={inviteAction} className="p-5 grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm font-semibold text-muted">
              Full name
              <input
                name="name"
                type="text"
                required
                placeholder="John Doe"
                className="border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-muted">
              Email address
              <input
                name="email"
                type="email"
                required
                placeholder="admin@ghanadeals.com"
                className="border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-muted">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-muted">
              Role
              <select
                name="role"
                defaultValue="customer_service"
                className="border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="super_admin">Super Admin</option>
                <option value="moderator">Moderator</option>
                <option value="customer_service">Customer Service</option>
              </select>
            </label>

            <div className="sm:col-span-2">
              <FormButton
                type="submit"
                pendingText="Creating…"
                className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Create Admin User
              </FormButton>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
