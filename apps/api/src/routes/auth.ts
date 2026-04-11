import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../lib/supabase.js";
import { createNotification } from "../lib/notifications.js";

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

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  password: z.string().min(8).max(128)
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
        return reply.code(500).send({ message: "Failed to create seller profile" });
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

    // Welcome notification (fire-and-forget)
    createNotification({
      userId,
      type: "welcome",
      title: "Welcome to GhanaDeals!",
      body: `Hi ${name}, your ${accountType} account is ready.`,
    }).catch((err) => request.log.error(err, "Failed to create welcome notification"));

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

    // Fetch agent record if agent, always fetch profile (dual-role: agents are also buyers)
    let agentRecord = null;
    let profileRecord = null;
    if (role === "agent") {
      const { data: agent } = await (supabaseAdmin as any)
        .from("agents")
        .select("id, name, company, phone, verified, rating, areas, years, color")
        .eq("user_id", userId)
        .single();
      agentRecord = agent;
    }
    // Always fetch profile (buyers always have one; upgraded agents keep theirs)
    const { data: profile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
      .eq("user_id", userId)
      .single();
    profileRecord = profile ?? null;

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
    }
    // Always fetch profile (dual-role: agents keep buyer profile)
    if (supabaseAdmin) {
      const { data: profile } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
        .eq("user_id", payload.sub)
        .single();
      profileRecord = profile ?? null;
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

  // ── POST /forgot-password ───────────────────────────────────
  app.post("/forgot-password", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = forgotPasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Please provide a valid email address" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const { email } = body.data;
    const webUrl = process.env.CORS_ORIGINS?.split(",")[0] ?? "http://localhost:3000";

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${webUrl}/reset-password`
    });

    if (error) {
      request.log.error(error, "Password reset email failed");
    }

    // Always return success to prevent email enumeration
    return { message: "If an account with that email exists, a password reset link has been sent." };
  });

  // ── POST /reset-password ────────────────────────────────────
  app.post("/reset-password", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = resetPasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid request data" });
    }

    const supabaseClient = getSupabaseServerClient();
    if (!supabaseClient) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const { accessToken, refreshToken, password } = body.data;

    // Set the session from the recovery tokens
    const { error: sessionError } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (sessionError) {
      return reply.code(400).send({ message: "Invalid or expired reset link. Please request a new one." });
    }

    // Update the password
    const { error: updateError } = await supabaseClient.auth.updateUser({
      password
    });

    if (updateError) {
      return reply.code(400).send({ message: "Failed to update password. Please try again." });
    }

    return { message: "Password has been reset successfully. You can now log in with your new password." };
  });
}
