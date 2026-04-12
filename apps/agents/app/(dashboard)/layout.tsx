import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AgentSidebar } from "@/components/agent-sidebar";
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
      <div className="min-h-screen grid grid-cols-[260px_1fr] max-lg:grid-cols-1">
        <AgentSidebar logoutAction={logoutAction} />
        <main className="p-6 sm:p-8 grid gap-6 content-start overflow-x-hidden">
          {children}
        </main>
      </div>
    </DashboardWsWrapper>
  );
}
