import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Invalid email or password.",
  forbidden:
    "Login succeeded, but this user is missing an allowed admin role.",
  config: "Supabase auth is not configured in the API environment.",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/";
  const errorMessage = errorMessages[params.error ?? ""] ?? "";

  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const destination = String(formData.get("next") ?? "/");
    const target = destination.startsWith("/") ? destination : "/";

    if (!email || !password) {
      redirect(`/login?next=${encodeURIComponent(target)}&error=invalid`);
    }

    const result = await loginAdmin(email, password);

    if (!result.ok) {
      redirect(
        `/login?next=${encodeURIComponent(target)}&error=${result.reason}`
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("gd_admin_session", result.data.token, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      sameSite: "lax",
      path: "/",
    });
    // Store role in a readable cookie for sidebar nav filtering
    cookieStore.set("gd_admin_role", result.data.user.role, {
      httpOnly: false,
      maxAge: 60 * 60 * 8,
      sameSite: "lax",
      path: "/",
    });

    redirect(target);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <section className="w-full max-w-md bg-panel border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-accent" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
            Admin Portal
          </p>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
        <p className="text-sm text-text-secondary mb-6">
          Access the GhanaDeals marketplace admin dashboard.
        </p>

        <form className="grid gap-4" action={loginAction}>
          <input type="hidden" name="next" value={nextPath} />

          {errorMessage && (
            <p className="px-3 py-2 bg-red-500/10 text-red-600 text-sm font-medium rounded-md">
              {errorMessage}
            </p>
          )}

          <label className="grid gap-1 text-sm font-semibold text-muted">
            Email address
            <input
              name="email"
              type="email"
              placeholder="admin@ghanadeals.com"
              autoComplete="email"
              required
              className="border border-border rounded-lg bg-panel-alt px-3.5 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-muted">
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

          <SubmitButton
            className="bg-accent text-white py-2.5 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-60"
          >
            Sign in
          </SubmitButton>
        </form>

        <p className="text-xs text-muted mt-5 leading-relaxed">
          Credentials are validated through the API using Supabase auth. Access
          is restricted to users with an admin role.
        </p>
      </section>
    </main>
  );
}
