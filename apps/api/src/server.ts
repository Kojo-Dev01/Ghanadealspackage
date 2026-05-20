import dotenv from "dotenv";
import Fastify from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { initSentry, captureException } from "./lib/sentry.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPropertyRoutes } from "./routes/properties.js";
import { registerUploadRoutes } from "./routes/uploads.js";
import { registerAgentRoutes } from "./routes/agents.js";
import { registerAdminAuthRoutes } from "./routes/admin-auth.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerInquiryRoutes } from "./routes/inquiries.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerAgentDashboardRoutes } from "./routes/agent-dashboard.js";
import { registerBuyerRoutes } from "./routes/buyer.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerWebSocketPlugin } from "./plugins/websocket.js";
import { registerOtel } from "./plugins/otel.js";
import { registerConversationRoutes } from "./routes/conversations.js";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(serverDir, "../../../.env");
const cwdEnvPath = path.resolve(process.cwd(), ".env");

// Prefer workspace root .env, but allow process cwd .env when running from the repo root.
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: cwdEnvPath, override: false });

// Init Sentry (no-op if SENTRY_DSN not set)
initSentry();

const app = Fastify({ logger: true });
const host = process.env.API_HOST ?? "0.0.0.0";
const port = Number(process.env.API_PORT ?? 4000);

await app.register(cors, {
  origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(","),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
});
await app.register(helmet, {
  contentSecurityPolicy: false // CSP handled by Next.js frontends
});
await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute"
});
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_me") {
  throw new Error("JWT_SECRET environment variable must be set");
}
await app.register(jwt, {
  secret: process.env.JWT_SECRET
});
await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 }
});


// Register otel, skipping /v1/ws (websocket upgrades)
await registerOtel(app);

// WebSocket – must be registered on the root app before routes
await registerWebSocketPlugin(app);

app.register(async (v1) => {
  v1.register(registerHealthRoutes, { prefix: "/health" });
  v1.register(registerPropertyRoutes, { prefix: "/properties" });
  v1.register(registerAgentRoutes, { prefix: "/agents" });
  v1.register(registerInquiryRoutes, { prefix: "/inquiries" });
  v1.register(registerAuthRoutes, { prefix: "/auth" });
  v1.register(registerAgentDashboardRoutes, { prefix: "/agent" });
  v1.register(registerBuyerRoutes, { prefix: "/buyer" });
  v1.register(registerNotificationRoutes, { prefix: "/notifications" });
  v1.register(registerConversationRoutes, { prefix: "/conversations" });
  v1.register(registerUploadRoutes, { prefix: "/uploads" });
  v1.register(registerAdminAuthRoutes, { prefix: "/admin/auth" });
  v1.register(registerAdminRoutes, { prefix: "/admin" });
}, { prefix: "/v1" });

// Global error handler — log + report to Sentry
app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
  captureException(error);
  request.log.error(error);
  const statusCode = error.statusCode ?? 500;
  reply.code(statusCode).send({
    message: statusCode >= 500 ? "Internal server error" : error.message
  });
});

app.listen({ host, port }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
