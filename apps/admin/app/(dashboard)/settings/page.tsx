import { AdminShell } from "@/components/admin-shell";
import { fetchAdminMe } from "@/lib/api";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const me = await fetchAdminMe();
  if (!me) redirect("/login");

  return (
    <AdminShell
      eyebrow="Account"
      title="Settings"
      description="Manage your profile and security."
    >
      <SettingsForm me={me} />
    </AdminShell>
  );
}
