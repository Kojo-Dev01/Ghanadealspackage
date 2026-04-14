import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";
import { createNotification } from "../lib/notifications.js";
import { sendToUser } from "../plugins/websocket.js";

/* ─── Schemas ─── */

const createConversationSchema = z.object({
  propertyId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  message: z.string().max(5000).transform((s) => s.trim()).optional().default(""),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000).transform((s) => s.trim()),
  messageType: z.enum(["text", "image", "file", "property_ref"]).optional().default("text"),
  attachmentUrl: z.string().url().max(2048).optional(),
  attachmentName: z.string().max(255).optional(),
  propertyRefId: z.string().uuid().optional(),
});

const paginationSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

/* ─── Routes ─── */

export async function registerConversationRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Authentication required" });
    }
  });

  /* ───────────────────────────────────────────
   * POST /  — Start or resume a conversation
   * Returns existing conversation if one exists
   * ─────────────────────────────────────────── */
  app.post("/", async (request, reply) => {
    const parsed = createConversationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
    }
    const { propertyId, message } = parsed.data;
    let { sellerId } = parsed.data;
    const { sub: userId } = request.user as { sub: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    let propertyTitle = "a seller";

    if (propertyId) {
      // Property-scoped conversation — verify property exists
      const { data: property } = await (supabase as any)
        .from("properties")
        .select("id, title, agent_id, agents!inner(id, user_id)")
        .eq("id", propertyId)
        .single();

      if (!property) {
        return reply.code(404).send({ message: "Property not found" });
      }

      propertyTitle = (property as { title: string }).title;

      if (!sellerId) {
        sellerId = (property as any).agents?.user_id;
      }
    }

    // For direct conversations sellerId is required
    if (!sellerId) {
      return reply.code(400).send({ message: "Could not determine seller" });
    }

    if (userId === sellerId) {
      return reply.code(400).send({ message: "Cannot start conversation with yourself" });
    }

    // Upsert conversation (find existing or create)
    let convoQuery = (supabase as any)
      .from("conversations")
      .select("id")
      .eq("buyer_id", userId)
      .eq("seller_id", sellerId);

    if (propertyId) {
      convoQuery = convoQuery.eq("property_id", propertyId);
    } else {
      convoQuery = convoQuery.is("property_id", null);
    }

    let { data: convo } = await convoQuery.single();

    if (!convo) {
      const insertPayload: Record<string, string> = { buyer_id: userId, seller_id: sellerId };
      if (propertyId) insertPayload.property_id = propertyId;

      const { data: newConvo, error } = await (supabase as any)
        .from("conversations")
        .insert(insertPayload)
        .select("id")
        .single();

      if (error) {
        // Race condition: another request created the same conversation — retry the lookup
        if (error.code === "23505") {
          let retryQuery = (supabase as any)
            .from("conversations")
            .select("id")
            .eq("buyer_id", userId)
            .eq("seller_id", sellerId);
          if (propertyId) {
            retryQuery = retryQuery.eq("property_id", propertyId);
          } else {
            retryQuery = retryQuery.is("property_id", null);
          }
          const { data: existing } = await retryQuery.single();
          if (existing) {
            convo = existing;
          } else {
            app.log.error(error, "Failed to create conversation");
            return reply.code(500).send({ message: "Failed to create conversation" });
          }
        } else {
          app.log.error(error, "Failed to create conversation");
          return reply.code(500).send({ message: "Failed to create conversation" });
        }
      } else {
        convo = newConvo;
      }
    }

    // Only insert a message if one was provided
    if (message) {
      const { data: msg, error: msgErr } = await (supabase as any)
        .from("messages")
        .insert({
          conversation_id: convo.id,
          sender_id: userId,
          content: message,
          message_type: "text",
        })
        .select("id, content, message_type, sender_id, created_at")
        .single();

      if (msgErr) {
        app.log.error(msgErr, "Failed to send message");
        return reply.code(500).send({ message: "Failed to send message" });
      }

      // Update last_message_at
      await (supabase as any)
        .from("conversations")
        .update({ last_message_at: msg.created_at })
        .eq("id", convo.id);

      // Real-time push to seller
      sendToUser(sellerId, {
        type: "new_message",
        conversationId: convo.id,
        message: msg,
      });

      // Notification for seller
      createNotification({
        userId: sellerId,
        type: "message_received",
        title: "New Message",
        body: propertyId
          ? `New message about "${propertyTitle}"`
          : `New direct message`,
        data: { conversationId: convo.id, ...(propertyId ? { propertyId } : {}) },
      }).catch((err) => app.log.error(err, "Failed to create message notification"));

      return reply.code(201).send({ conversationId: convo.id, message: msg });
    }

    return reply.code(201).send({ conversationId: convo.id, message: null });
  });

  /* ───────────────────────────────────────────
   * GET /  — List conversations for current user
   * Uses a single Postgres RPC to avoid N+1 queries.
   * ─────────────────────────────────────────── */
  app.get("/", async (request, reply) => {
    const { sub: userId } = request.user as { sub: string };
    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const { data, error } = await (supabase as any).rpc("get_conversations_for_user", {
      p_user_id: userId,
    });

    if (error) {
      app.log.error(error, "Failed to fetch conversations via RPC");
      return reply.code(500).send({ message: "Failed to fetch conversations" });
    }

    return data ?? [];
  });

  /* ───────────────────────────────────────────
   * GET /unread-count — Total unread messages
   * Single query using an inner join via PostgREST
   * ─────────────────────────────────────────── */
  app.get("/unread-count", async (request, reply) => {
    const { sub: userId } = request.user as { sub: string };
    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    // Single query: join messages to conversations, filter once
    const { count, error } = await (supabase as any)
      .from("messages")
      .select("id, conversations!inner(id)", { count: "exact", head: true })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`, { referencedTable: "conversations" })
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      app.log.error(error, "Failed to fetch unread count");
      return reply.code(500).send({ message: "Failed to fetch unread count" });
    }

    return { count: count ?? 0 };
  });

  /* ───────────────────────────────────────────
   * GET /:id — Get conversation detail
   * ─────────────────────────────────────────── */
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { sub: userId } = request.user as { sub: string };
    const { id } = request.params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const { data: convo, error } = await (supabase as any)
      .from("conversations")
      .select(`
        id,
        property_id,
        buyer_id,
        seller_id,
        last_message_at,
        created_at,
        properties ( id, title, image, price, location ),
        buyer:profiles!conversations_buyer_id_fkey ( user_id, name, email, avatar_url ),
        seller:profiles!conversations_seller_id_fkey ( user_id, name, email, avatar_url )
      `)
      .eq("id", id)
      .single();

    if (error || !convo) {
      return reply.code(404).send({ message: "Conversation not found" });
    }

    // Authorization: must be buyer or seller
    if (convo.buyer_id !== userId && convo.seller_id !== userId) {
      return reply.code(403).send({ message: "Not authorized" });
    }

    // Fetch agent avatars to fill in when profile avatar is missing
    const userIds = [convo.buyer_id, convo.seller_id];
    const { data: agentRows } = await (supabase as any)
      .from("agents")
      .select("user_id, avatar_url")
      .in("user_id", userIds);

    const agentAvatarMap: Record<string, string | null> = {};
    if (agentRows) {
      for (const a of agentRows) {
        agentAvatarMap[a.user_id] = a.avatar_url;
      }
    }

    if (convo.buyer) {
      convo.buyer.avatar_url = convo.buyer.avatar_url ?? agentAvatarMap[convo.buyer.user_id] ?? null;
    }
    if (convo.seller) {
      convo.seller.avatar_url = convo.seller.avatar_url ?? agentAvatarMap[convo.seller.user_id] ?? null;
    }

    return {
      id: convo.id,
      propertyId: convo.property_id,
      buyerId: convo.buyer_id,
      sellerId: convo.seller_id,
      property: convo.properties,
      buyer: convo.buyer,
      seller: convo.seller,
      lastMessageAt: convo.last_message_at,
      createdAt: convo.created_at,
    };
  });

  /* ───────────────────────────────────────────
   * GET /:id/messages — Paginated messages
   * ─────────────────────────────────────────── */
  app.get<{ Params: { id: string } }>("/:id/messages", async (request, reply) => {
    const { sub: userId } = request.user as { sub: string };
    const { id } = request.params;
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ message: "Invalid pagination" });
    }
    const { cursor, limit } = query.data;

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    // Verify user belongs to this conversation
    const { data: convo } = await (supabase as any)
      .from("conversations")
      .select("id, buyer_id, seller_id")
      .eq("id", id)
      .single();

    if (!convo || (convo.buyer_id !== userId && convo.seller_id !== userId)) {
      return reply.code(403).send({ message: "Not authorized" });
    }

    let q = (supabase as any)
      .from("messages")
      .select("id, conversation_id, sender_id, content, message_type, attachment_url, attachment_name, property_ref_id, read_at, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      q = q.lt("created_at", cursor);
    }

    const { data: messages, error } = await q;

    if (error) {
      app.log.error(error, "Failed to fetch messages");
      return reply.code(500).send({ message: "Failed to fetch messages" });
    }

    // Enrich property_ref messages with property details
    const reversed = (messages || []).reverse();
    const refIds = [...new Set(reversed.filter((m: any) => m.property_ref_id).map((m: any) => m.property_ref_id))];
    let propMap: Record<string, any> = {};
    if (refIds.length > 0) {
      const { data: props } = await (supabase as any)
        .from("properties")
        .select("id, title, image, price, location, listing_type")
        .in("id", refIds);
      if (props) {
        for (const p of props) {
          propMap[p.id] = { id: p.id, title: p.title, image: p.image, price: Number(p.price), location: p.location, listingType: p.listing_type };
        }
      }
    }

    return {
      messages: reversed.map((m: any) => ({
        ...m,
        property_ref: m.property_ref_id ? propMap[m.property_ref_id] ?? null : null,
      })),
      hasMore: (messages || []).length === limit,
    };
  });

  /* ───────────────────────────────────────────
   * POST /:id/messages — Send a message
   * ─────────────────────────────────────────── */
  app.post<{ Params: { id: string } }>("/:id/messages", async (request, reply) => {
    const { sub: userId } = request.user as { sub: string };
    const { id } = request.params;
    const parsed = sendMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid message", errors: parsed.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    // Verify user belongs to this conversation
    const { data: convo } = await (supabase as any)
      .from("conversations")
      .select("id, buyer_id, seller_id, property_id, properties ( title )")
      .eq("id", id)
      .single();

    if (!convo || (convo.buyer_id !== userId && convo.seller_id !== userId)) {
      return reply.code(403).send({ message: "Not authorized" });
    }

    const { content, messageType, attachmentUrl, attachmentName, propertyRefId } = parsed.data;

    // Validate attachment URL belongs to our storage domain
    if (attachmentUrl) {
      const wasabiEndpoint = process.env.WASABI_ENDPOINT ?? "https://s3.wasabisys.com";
      if (!attachmentUrl.startsWith(wasabiEndpoint)) {
        return reply.code(400).send({ message: "Invalid attachment URL" });
      }
    }

    // If property_ref, verify property exists and get details
    let propertyRefData: any = null;
    if (messageType === "property_ref" && propertyRefId) {
      const { data: prop } = await (supabase as any)
        .from("properties")
        .select("id, title, image, price, location, listing_type")
        .eq("id", propertyRefId)
        .single();
      if (!prop) {
        return reply.code(404).send({ message: "Referenced property not found" });
      }
      propertyRefData = { id: prop.id, title: prop.title, image: prop.image, price: Number(prop.price), location: prop.location, listingType: prop.listing_type };
    }

    const { data: msg, error } = await (supabase as any)
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: userId,
        content,
        message_type: messageType,
        attachment_url: attachmentUrl ?? null,
        attachment_name: attachmentName ?? null,
        property_ref_id: propertyRefId ?? null,
      })
      .select("id, conversation_id, sender_id, content, message_type, attachment_url, attachment_name, property_ref_id, read_at, created_at")
      .single();

    if (error) {
      app.log.error(error, "Failed to send message");
      return reply.code(500).send({ message: "Failed to send message" });
    }

    // Enrich with property_ref data
    const enrichedMsg = { ...msg, property_ref: propertyRefData };

    // Update last_message_at
    await (supabase as any)
      .from("conversations")
      .update({ last_message_at: msg.created_at })
      .eq("id", id);

    // Real-time push to the other user
    const recipientId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id;
    sendToUser(recipientId, {
      type: "new_message",
      conversationId: id,
      message: enrichedMsg,
    });

    // Notification for recipient
    createNotification({
      userId: recipientId,
      type: "message_received",
      title: "New Message",
      body: `New message about "${convo.properties?.title ?? "a property"}"`,
      data: { conversationId: id, propertyId: convo.property_id },
    }).catch((err) => app.log.error(err, "Failed to create message notification"));

    return reply.code(201).send(enrichedMsg);
  });

  /* ───────────────────────────────────────────
   * PATCH /:id/read — Mark messages as read
   * ─────────────────────────────────────────── */
  app.patch<{ Params: { id: string } }>("/:id/read", async (request, reply) => {
    const { sub: userId } = request.user as { sub: string };
    const { id } = request.params;

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    // Verify user belongs to this conversation
    const { data: convo } = await (supabase as any)
      .from("conversations")
      .select("id, buyer_id, seller_id")
      .eq("id", id)
      .single();

    if (!convo || (convo.buyer_id !== userId && convo.seller_id !== userId)) {
      return reply.code(403).send({ message: "Not authorized" });
    }

    // Mark all messages NOT from me as read
    const { error } = await (supabase as any)
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", id)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      app.log.error(error, "Failed to mark messages as read");
      return reply.code(500).send({ message: "Failed to mark as read" });
    }

    // Notify sender that messages were read
    const otherUserId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id;
    sendToUser(otherUserId, {
      type: "messages_read",
      conversationId: id,
      readBy: userId,
    });

    return { ok: true };
  });

  /* ───────────────────────────────────────────
   * GET /:id/seller-properties — Properties owned
   * by the seller in this conversation (for @ tagging)
   * ─────────────────────────────────────────── */
  app.get<{ Params: { id: string } }>("/:id/seller-properties", async (request, reply) => {
    const { sub: userId } = request.user as { sub: string };
    const { id } = request.params;

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const { data: convo } = await (supabase as any)
      .from("conversations")
      .select("id, buyer_id, seller_id")
      .eq("id", id)
      .single();

    if (!convo || (convo.buyer_id !== userId && convo.seller_id !== userId)) {
      return reply.code(403).send({ message: "Not authorized" });
    }

    // Single query: join agents → properties for the seller
    const { data: props } = await (supabase as any)
      .from("properties")
      .select("id, title, image, price, location, listing_type, agents!inner(user_id)")
      .eq("agents.user_id", convo.seller_id)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);

    return (props ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      image: p.image,
      price: Number(p.price),
      location: p.location,
      listingType: p.listing_type,
    }));
  });
}
