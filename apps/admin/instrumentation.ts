export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  // Edge runtime Sentry has dependency issues on Vercel; server/client is sufficient
}
