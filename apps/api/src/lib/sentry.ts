import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  });
}

export function captureException(error: unknown) {
  if (dsn) {
    Sentry.captureException(error);
  }
}
