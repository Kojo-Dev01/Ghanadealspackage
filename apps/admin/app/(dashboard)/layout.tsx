import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("gd_admin_role")?.value ?? "customer_service";

  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("gd_admin_session");
    cookieStore.delete("gd_admin_role");
    redirect("/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] max-lg:grid-cols-1">
      <AdminSidebar role={role} logoutAction={logoutAction} />
      <section className="flex flex-col gap-6 p-6 lg:p-8 overflow-x-hidden">
        {children}
      </section>
    </div>
  );
}
