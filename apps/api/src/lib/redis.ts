import Redis from "ioredis";
import { randomUUID } from "node:crypto";

const CHANNEL = "gd:ws:messages";
const INSTANCE_ID = randomUUID();

let pub: Redis | null = null;
let sub: Redis | null = null;
let messageHandler: ((userId: string, payload: string) => void) | null = null;

function getRedisUrl(): string | null {
  return process.env.REDIS_URL || null;
}

/** Initialise publisher + subscriber. Call once at startup. */
export function initRedis(onMessage: (userId: string, payload: string) => void) {
  const url = getRedisUrl();
  if (!url) return false;

  messageHandler = onMessage;

  pub = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
  sub = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });

  pub.connect().catch(() => {
    console.warn("[redis] publisher failed to connect — falling back to local-only WS");
    pub = null;
  });

  pub.on("ready", () => {
    console.info("[redis] publisher connected successfully");
  });

  sub.connect().then(() => {
    console.info("[redis] subscriber connected successfully");
    sub!.subscribe(CHANNEL).catch(() => {});
    sub!.on("message", (_ch: string, raw: string) => {
      try {
        const { userId, payload, origin } = JSON.parse(raw) as { userId: string; payload: string; origin?: string };
        // Skip messages published by this same instance (already delivered locally)
        if (origin === INSTANCE_ID) return;
        if (messageHandler) messageHandler(userId, payload);
      } catch {
        // ignore malformed
      }
    });
  }).catch(() => {
    console.warn("[redis] subscriber failed to connect — falling back to local-only WS");
    sub = null;
  });

  return true;
}

/**
 * Publish a message through Redis so all API servers can deliver it.
 * Returns false if Redis is not available (caller should fall back to local delivery).
 */
export function publishToUser(userId: string, payload: string): boolean {
  if (!pub || pub.status !== "ready") return false;
  pub.publish(CHANNEL, JSON.stringify({ userId, payload, origin: INSTANCE_ID })).catch(() => {});
  return true;
}

/** Graceful shutdown */
export async function shutdownRedis() {
  if (sub) { sub.disconnect(); sub = null; }
  if (pub) { pub.disconnect(); pub = null; }
}
