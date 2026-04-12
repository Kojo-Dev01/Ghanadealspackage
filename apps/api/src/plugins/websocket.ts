import type { FastifyInstance, FastifyRequest } from "fastify";
import websocket from "@fastify/websocket";
import type { WebSocket } from "ws";
import { initRedis, publishToUser, shutdownRedis } from "../lib/redis.js";

/** Max concurrent WS connections per user (prevents tab-spam) */
const MAX_CONNECTIONS_PER_USER = 10;

/** Server-side heartbeat interval (ms) — detects dead sockets */
const HEARTBEAT_INTERVAL = 30_000;

/** If no pong received within this window, terminate the socket */
const HEARTBEAT_TIMEOUT = 10_000;

/** userId → Set of connected sockets (local to this process) */
const connections = new Map<string, Set<WebSocket>>();

/** Track which sockets are alive (responded to last ping) */
const socketAlive = new WeakMap<WebSocket, boolean>();

/** Deliver payload to local sockets for a specific user */
function deliverLocally(userId: string, raw: string) {
  const sockets = connections.get(userId);
  if (!sockets) return;
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) {
      ws.send(raw);
    }
  }
}

/**
 * Send a JSON payload to a user across all server instances.
 * Always delivers locally. Additionally publishes to Redis so other instances can deliver too.
 */
export function sendToUser(userId: string, payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload);
  // Always deliver to local sockets first
  deliverLocally(userId, raw);
  // Also publish to Redis for other server instances
  publishToUser(userId, raw);
}

export async function registerWebSocketPlugin(app: FastifyInstance) {
  await app.register(websocket);

  // Initialise Redis pub/sub — when a message arrives from any server, deliver locally
  const redisActive = initRedis((userId, raw) => {
    deliverLocally(userId, raw);
  });

  if (redisActive) {
    app.log.info("WebSocket Redis pub/sub enabled — multi-server support active");
  } else {
    app.log.info("WebSocket running in local-only mode (set REDIS_URL to enable pub/sub)");
  }

  // Server-side heartbeat: ping all sockets periodically and terminate unresponsive ones
  const heartbeatTimer = setInterval(() => {
    for (const [userId, sockets] of connections) {
      for (const ws of sockets) {
        if (socketAlive.get(ws) === false) {
          // Did not respond to last ping — terminate
          ws.terminate();
          sockets.delete(ws);
          continue;
        }
        // Mark as waiting for pong, then send ping
        socketAlive.set(ws, false);
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      }
      if (sockets.size === 0) connections.delete(userId);
    }
  }, HEARTBEAT_INTERVAL);

  // Graceful shutdown
  app.addHook("onClose", async () => {
    clearInterval(heartbeatTimer);
    await shutdownRedis();
  });

  app.get("/v1/ws", { websocket: true }, (socket: WebSocket, request: FastifyRequest) => {
    // Authenticate via query-string token: /v1/ws?token=<jwt>
    const url = new URL(request.url, `http://${request.hostname}`);
    const token = url.searchParams.get("token");

    if (!token) {
      socket.close(4001, "Missing token");
      return;
    }

    let userId: string;
    try {
      const decoded = app.jwt.verify<{ sub: string }>(token);
      userId = decoded.sub;
    } catch {
      socket.close(4003, "Invalid token");
      return;
    }

    // Enforce per-user connection limit
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    const userSockets = connections.get(userId)!;
    if (userSockets.size >= MAX_CONNECTIONS_PER_USER) {
      // Close the oldest connection to make room
      const oldest = userSockets.values().next().value;
      if (oldest) {
        oldest.close(4008, "Too many connections");
        userSockets.delete(oldest);
      }
    }

    userSockets.add(socket);
    socketAlive.set(socket, true);

    app.log.info({ userId, connections: userSockets.size }, "WS connected");

    // Handle native pong frames (response to server-side ping)
    socket.on("pong", () => {
      socketAlive.set(socket, true);
    });

    // Handle application-level messages (client ping/pong heartbeat)
    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === "ping") {
          socket.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore non-JSON
      }
    });

    socket.on("close", () => {
      const set = connections.get(userId);
      if (set) {
        set.delete(socket);
        if (set.size === 0) connections.delete(userId);
      }
      app.log.info({ userId }, "WS disconnected");
    });
  });
}
