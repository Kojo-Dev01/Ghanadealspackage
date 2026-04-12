import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardWsWrapper } from "@/components/dashboard-ws-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("gd_agent_session");
    redirect("/login");
  }

  return (
    <DashboardWsWrapper>
      <DashboardShell logoutAction={logoutAction}>
        {children}
      </DashboardShell>
    </DashboardWsWrapper>
  );
}
