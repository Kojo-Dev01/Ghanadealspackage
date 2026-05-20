import * as Sentry from "@sentry/node";

function getDsn() {
  return process.env.SENTRY_DSN;
}

export function initSentry() {
  const dsn = getDsn();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    // Prevent duplicate Fastify otel plugin registration.
    integrations: (defaultIntegrations) =>
      defaultIntegrations.filter((integration) => !integration.name.toLowerCase().includes("fastify")),
  });
}

export function captureException(error: unknown) {
  const dsn = getDsn();
  if (dsn) {
    Sentry.captureException(error);
  }
}
