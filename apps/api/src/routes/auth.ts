import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../lib/supabase.js";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  password: z.string().min(8).max(128),
  accountType: z.enum(["buyer", "agent"])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function registerAuthRoutes(app: FastifyInstance) {
  // ── POST /signup ────────────────────────────────────────────
  app.post("/signup", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = signupSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid signup data", errors: body.error.flatten().fieldErrors });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const { name, email, phone, password, accountType } = body.data;

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role: accountType }
    });

    if (authError) {
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        return reply.code(409).send({ message: "An account with this email already exists" });
      }
      request.log.error(authError, "Supabase auth signup error");
      return reply.code(500).send({ message: "Failed to create account" });
    }

    const userId = authData.user.id;

    // If agent, create agents row
    let agentRecord = null;
    let profileRecord = null;
    if (accountType === "agent") {
      const { data: agent, error: agentError } = await (supabaseAdmin as any)
        .from("agents")
        .insert({
          user_id: userId,
          name,
          email,
          company: "",
          phone
        })
        .select("id, name, company, phone, verified")
        .single();

      if (agentError) {
        request.log.error(agentError, "Failed to create agent record");
        // Rollback: remove the auth user we just created
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return reply.code(500).send({ message: "Failed to create agent profile" });
      }
      agentRecord = agent;
    } else {
      // Create buyer profile row
      const { data: profile, error: profileError } = await (supabaseAdmin as any)
        .from("profiles")
        .insert({ user_id: userId, name, email, phone })
        .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
        .single();

      if (profileError) {
        request.log.error(profileError, "Failed to create buyer profile");
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return reply.code(500).send({ message: "Failed to create user profile" });
      }
      profileRecord = profile;
    }

    // Sign in to get a session
    const supabaseClient = getSupabaseServerClient();
    if (!supabaseClient) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const token = app.jwt.sign(
      { sub: userId, email, role: accountType, name },
      { expiresIn: "7d" }
    );

    return reply.code(201).send({
      token,
      user: { id: userId, email, name, role: accountType },
      agent: agentRecord,
      profile: profileRecord
    });
  });

  // ── POST /login ─────────────────────────────────────────────
  app.post("/login", { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid login data" });
    }

    const supabaseClient = getSupabaseServerClient();
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseClient || !supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const { email, password } = body.data;

    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (signInError || !signInData.user) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const userId = signInData.user.id;
    const meta = signInData.user.user_metadata ?? {};
    const role = String(meta.role ?? "buyer");
    const name = String(meta.name ?? "");

    // If agent, fetch agent record
    let agentRecord = null;
    let profileRecord = null;
    if (role === "agent") {
      const { data: agent } = await (supabaseAdmin as any)
        .from("agents")
        .select("id, name, company, phone, verified, rating, areas, years, color")
        .eq("user_id", userId)
        .single();
      agentRecord = agent;
    } else {
      const { data: profile } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
        .eq("user_id", userId)
        .single();
      profileRecord = profile;
    }

    const token = app.jwt.sign(
      { sub: userId, email, role, name },
      { expiresIn: "7d" }
    );

    return {
      token,
      user: { id: userId, email, name, role },
      agent: agentRecord,
      profile: profileRecord
    };
  });

  // ── GET /me ─────────────────────────────────────────────────
  app.get("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Not authenticated" });
    }

    const payload = request.user as { sub: string; email: string; role: string; name: string };
    const supabaseAdmin = getSupabaseAdminClient();

    let agentRecord = null;
    let profileRecord = null;
    if (payload.role === "agent" && supabaseAdmin) {
      const { data: agent } = await (supabaseAdmin as any)
        .from("agents")
        .select("id, name, company, phone, verified, rating, areas, years, color")
        .eq("user_id", payload.sub)
        .single();
      agentRecord = agent;
    } else if (supabaseAdmin) {
      const { data: profile } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
        .eq("user_id", payload.sub)
        .single();
      profileRecord = profile;
    }

    return {
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role
      },
      agent: agentRecord,
      profile: profileRecord
    };
  });
}
