// Fastify otel plugin registration helper

import type { FastifyInstance } from "fastify";
import FastifyOtelInstrumentation from "@fastify/otel";

/**
 * Registers @fastify/otel, skipping problematic routes (e.g. /v1/ws for websocket upgrades).
 * Usage: await registerOtel(app);
 */
export async function registerOtel(app: FastifyInstance) {
  const otel = new FastifyOtelInstrumentation({
    ignorePaths: (route) => route.url === "/v1/ws",
  });
  await app.register(otel.plugin());
}
