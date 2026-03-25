import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAgent } from "@/lib/api";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function AgentLoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/";
  const errorMessage =
    params.error === "invalid"
      ? "Invalid email or password."
      : params.error === "forbidden"
        ? "This account does not have agent access."
        : params.error === "config"
          ? "Authentication service is not available. Please try again later."
          : "";

  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const destination = String(formData.get("next") ?? "/");
    const target = destination.startsWith("/") ? destination : "/";

    if (!email || !password) {
      redirect(
        `/login?next=${encodeURIComponent(target)}&error=invalid`
      );
    }

    const result = await loginAgent(email, password);

    if (!result.ok) {
      redirect(
        `/login?next=${encodeURIComponent(target)}&error=${result.reason}`
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("gd_agent_session", result.data.token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      path: "/",
    });

    redirect(target);
  }

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-sidebar">
      <section className="w-full max-w-md bg-panel border border-border shadow-xl rounded-xl p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
          Agent Portal
        </p>
        <h1 className="text-[22px] font-extrabold">Sign in</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Access your property listings and manage inquiries.
        </p>

        <form className="grid gap-3.5 mt-6" action={loginAction}>
          <input type="hidden" name="next" value={nextPath} />

          {errorMessage && (
            <p className="px-3 py-2 bg-red-500/10 text-red-600 text-sm font-medium rounded-md">
              {errorMessage}
            </p>
          )}

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Email address
            <input
              name="email"
              type="email"
              placeholder="agent@example.com"
              autoComplete="email"
              required
              className="border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Password
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            className="mt-1.5 bg-accent text-white py-2.5 px-4 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Sign in →
          </button>
        </form>

        <p className="mt-5 pt-4 border-t border-border text-xs text-muted leading-relaxed">
          Sign in with the same credentials you used to register on the
          GhanaDeals marketplace. Only agent accounts can access this dashboard.
        </p>
      </section>
    </main>
  );
}
