import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AgentShell } from "@/components/agent-shell";
import { ProfileAvatarField } from "@/components/profile-avatar-field";
import { fetchAgentProfile, updateAgentProfile } from "@/lib/api";

type ProfilePageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AgentProfilePage({
  searchParams,
}: ProfilePageProps) {
  const params = await searchParams;
  const profile = await fetchAgentProfile();

  async function saveProfileAction(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const token = cookieStore.get("gd_agent_session")?.value;
    if (!token) {
      redirect("/login?next=%2Fprofile");
    }

    const name = String(formData.get("name") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();
    const areasRaw = String(formData.get("areas") ?? "").trim();
    const years = Number(formData.get("years") ?? "0") || 0;
    const avatarRaw = String(formData.get("avatar_url") ?? "").trim();
    const avatar_url = avatarRaw || null;

    const areas = areasRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await updateAgentProfile({
      name,
      company,
      phone,
      color,
      areas,
      years,
      avatar_url,
    });

    if (result) {
      redirect("/profile?success=1");
    } else {
      redirect("/profile?error=1");
    }
  }

  const inputClasses =
    "border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <AgentShell
      activeNav="profile"
      eyebrow="Account"
      title="Profile"
      description="Update your seller information displayed on the marketplace."
    >
      <section className="bg-panel border border-border rounded-xl p-5 shadow-sm">
        {params.success && (
          <p className="mb-4 px-3 py-2 bg-green-500/10 text-green-600 text-sm font-medium rounded-md">
            Profile updated successfully.
          </p>
        )}
        {params.error && (
          <p className="mb-4 px-3 py-2 bg-red-500/10 text-red-600 text-sm font-medium rounded-md">
            Failed to update profile. Please try again.
          </p>
        )}

        <form className="grid gap-4" action={saveProfileAction}>
          <div className="pb-2 border-b border-border">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Profile Photo</label>
            <ProfileAvatarField
              currentUrl={profile?.avatar_url}
              agentName={profile?.name ?? "Seller"}
              agentColor={profile?.color ?? "#3B82F6"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Full Name
              <input
                name="name"
                type="text"
                defaultValue={profile?.name ?? ""}
                required
                className={inputClasses}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Company
              <input
                name="company"
                type="text"
                defaultValue={profile?.company ?? ""}
                className={inputClasses}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Phone
              <input
                name="phone"
                type="tel"
                defaultValue={profile?.phone ?? ""}
                className={inputClasses}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Brand Color
              <input
                name="color"
                type="color"
                defaultValue={profile?.color || "#16a34a"}
                className="border border-border rounded-lg bg-panel-alt h-[42px] p-1 cursor-pointer"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Service Areas (comma-separated)
            <input
              name="areas"
              type="text"
              defaultValue={profile?.areas?.join(", ") ?? ""}
              placeholder="Accra, Kumasi, Tema"
              className={inputClasses}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Years of Experience
            <input
              name="years"
              type="number"
              min="0"
              max="99"
              defaultValue={String(profile?.years ?? 0)}
              className={inputClasses}
            />
          </label>

          <button
            type="submit"
            className="justify-self-start bg-accent text-white py-2.5 px-5 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      </section>
    </AgentShell>
  );
}
