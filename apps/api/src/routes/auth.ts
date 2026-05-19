import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomInt, randomBytes, createHash } from "crypto";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../lib/supabase.js";
import { createNotification } from "../lib/notifications.js";
import { sendOtpEmail } from "../lib/email.js";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  password: z.string().min(8).max(128),
  accountType: z.enum(["buyer"])
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

const sendOtpSchema = z.object({
  userId: z.string().uuid(),
  verificationToken: z.string().min(1),
});

const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
  verificationToken: z.string().min(1),
});

const cancelVerificationSchema = z.object({
  userId: z.string().uuid(),
  verificationToken: z.string().min(1),
});

/** Generate a cryptographically random 6-digit OTP */
function generateOtp(): string {
  return String(randomInt(100_000, 999_999));
}

/** Generate a random verification token to secure the OTP flow */
function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

const OTP_EXPIRY_MINUTES = 10;

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

    // Sign in to get a session
    const supabaseClient = getSupabaseServerClient();
    if (!supabaseClient) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    // Generate and send OTP for email verification
    const otpCode = generateOtp();
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

    // Invalidate any existing OTPs for this user
    await (supabaseAdmin as any)
      .from("email_otps")
      .update({ used: true })
      .eq("user_id", userId)
      .eq("used", false);

    const { error: otpInsertError } = await (supabaseAdmin as any)
      .from("email_otps")
      .insert({ user_id: userId, email, code: otpCode, expires_at: expiresAt, verification_token: verificationToken });

    if (otpInsertError) {
      request.log.error(otpInsertError, "Failed to insert OTP row");
      // Clean up — user was just created but OTP can't be stored
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return reply.code(500).send({ message: "Failed to create verification code" });
    }

    // Send OTP email (fire-and-forget logging, but we still await)
    sendOtpEmail(email, name, otpCode).catch((err) =>
      request.log.error(err, "Failed to send OTP email"),
    );

    // Welcome notification (fire-and-forget)
    createNotification({
      userId,
      type: "welcome",
      title: "Welcome to GhanaDeals!",
      body: `Hi ${name}, your ${accountType} account is ready.`,
    }).catch((err) => request.log.error(err, "Failed to create welcome notification"));

    // Return needsVerification — client must complete OTP before getting a token
    return reply.code(201).send({
      needsVerification: true,
      userId,
      email,
      name,
      role: accountType,
      verificationToken,
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

    // Check if email is verified and if account is suspended
    const { data: profileCheck } = await (supabaseAdmin as any)
      .from("profiles")
      .select("email_verified, suspended, suspended_reason")
      .eq("user_id", userId)
      .single();

    // Block suspended users
    if (profileCheck?.suspended) {
      const reason = profileCheck.suspended_reason
        ? `Your account has been suspended: ${profileCheck.suspended_reason}`
        : "Your account has been suspended. Please contact support for assistance.";
      return reply.code(403).send({ message: reason, suspended: true });
    }

    if (profileCheck && !profileCheck.email_verified) {
      // Send a new OTP automatically
      const otpCode = generateOtp();
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

      await (supabaseAdmin as any)
        .from("email_otps")
        .update({ used: true })
        .eq("user_id", userId)
        .eq("used", false);

      const { error: otpInsertError } = await (supabaseAdmin as any)
        .from("email_otps")
        .insert({ user_id: userId, email, code: otpCode, expires_at: expiresAt, verification_token: verificationToken });

      if (otpInsertError) {
        request.log.error(otpInsertError, "Failed to insert OTP row on login");
        return reply.code(500).send({ message: "Failed to create verification code" });
      }

      sendOtpEmail(email, name, otpCode).catch((err) =>
        request.log.error(err, "Failed to send OTP email"),
      );

      return reply.code(403).send({
        needsVerification: true,
        userId,
        email,
        name,
        role,
        verificationToken,
        message: "Please verify your email to continue",
      });
    }

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
    // Deep-link into the mobile app.
    // NOTE: add "ghanadealsapp://reset-password" to the list of allowed redirect URLs
    // in your Supabase project → Authentication → URL Configuration.
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: "ghanadealsapp://reset-password"
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

  // ── POST /send-otp ─────────────────────────────────────────
  app.post("/send-otp", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = sendOtpSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid request" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const { userId, verificationToken } = body.data;

    // Verify that the caller owns this OTP flow by checking the verification token
    const { data: tokenCheck } = await (supabaseAdmin as any)
      .from("email_otps")
      .select("id")
      .eq("user_id", userId)
      .eq("verification_token", verificationToken)
      .limit(1)
      .single();

    if (!tokenCheck) {
      return reply.code(403).send({ message: "Invalid verification session" });
    }

    // Look up user
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !authUser?.user) {
      return reply.code(404).send({ message: "User not found" });
    }

    const email = authUser.user.email!;
    const name = String(authUser.user.user_metadata?.name ?? "");

    // Invalidate previous OTPs
    await (supabaseAdmin as any)
      .from("email_otps")
      .update({ used: true })
      .eq("user_id", userId)
      .eq("used", false);

    const otpCode = generateOtp();
    const newVerificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

    const { error: otpInsertError } = await (supabaseAdmin as any)
      .from("email_otps")
      .insert({ user_id: userId, email, code: otpCode, expires_at: expiresAt, verification_token: newVerificationToken });

    if (otpInsertError) {
      request.log.error(otpInsertError, "Failed to insert OTP row on resend");
      return reply.code(500).send({ message: "Failed to create verification code" });
    }

    sendOtpEmail(email, name, otpCode).catch((err) =>
      request.log.error(err, "Failed to send OTP email"),
    );

    return { message: "Verification code sent", email, verificationToken: newVerificationToken };
  });

  // ── POST /verify-otp ───────────────────────────────────────
  app.post("/verify-otp", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = verifyOtpSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid request" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const { userId, code, verificationToken } = body.data;

    // Find valid OTP matching both code and verification token
    const { data: otpRow } = await (supabaseAdmin as any)
      .from("email_otps")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("verification_token", verificationToken)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otpRow) {
      return reply.code(400).send({ message: "Invalid verification code" });
    }

    if (new Date(otpRow.expires_at) < new Date()) {
      return reply.code(400).send({ message: "Verification code has expired. Please request a new one." });
    }

    // Mark ALL OTPs for this user as used (not just the matched one)
    await (supabaseAdmin as any)
      .from("email_otps")
      .update({ used: true })
      .eq("user_id", userId)
      .eq("used", false);

    // Mark profile as email_verified
    await (supabaseAdmin as any)
      .from("profiles")
      .update({ email_verified: true })
      .eq("user_id", userId);

    // Fetch user info to issue token
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!authUser?.user) {
      return reply.code(500).send({ message: "User not found" });
    }

    const meta = authUser.user.user_metadata ?? {};
    const email = authUser.user.email!;
    const role = String(meta.role ?? "buyer");
    const name = String(meta.name ?? "");

    // Fetch profile / agent records
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
    const { data: profile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
      .eq("user_id", userId)
      .single();
    profileRecord = profile ?? null;

    const token = app.jwt.sign(
      { sub: userId, email, role, name },
      { expiresIn: "7d" },
    );

    return {
      token,
      user: { id: userId, email, name, role },
      agent: agentRecord,
      profile: profileRecord,
    };
  });

  // ── POST /cancel-verification ──────────────────────────────
  // Deletes an unverified account so the user can sign up with a different email
  app.post("/cancel-verification", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = cancelVerificationSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid request" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service is not configured" });
    }

    const { userId, verificationToken } = body.data;

    // Verify the caller owns this flow
    const { data: tokenCheck } = await (supabaseAdmin as any)
      .from("email_otps")
      .select("id")
      .eq("user_id", userId)
      .eq("verification_token", verificationToken)
      .limit(1)
      .single();

    if (!tokenCheck) {
      return reply.code(403).send({ message: "Invalid verification session" });
    }

    // Only allow deletion if the account is unverified
    const { data: profileCheck } = await (supabaseAdmin as any)
      .from("profiles")
      .select("email_verified")
      .eq("user_id", userId)
      .single();

    if (profileCheck?.email_verified) {
      return reply.code(400).send({ message: "Account is already verified" });
    }

    // Delete the auth user (cascades to profiles, email_otps via ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      request.log.error(error, "Failed to delete unverified user");
      return reply.code(500).send({ message: "Failed to cancel verification" });
    }

    return { message: "Account removed. You can sign up with a different email." };
  });

  // ── SSO ── One-time token exchange for cross-app authentication ──

  const SSO_TOKEN_TTL_SECONDS = 30; // Token expires in 30 seconds
  const SSO_TOKEN_BYTES = 32;       // 256-bit random token

  function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  // POST /sso/generate — Authenticated user generates a single-use SSO token
  app.post("/sso/generate", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Not authenticated" });
    }

    const payload = request.user as { sub: string; email: string; role: string; name: string };

    // Only agents can SSO into the seller dashboard
    if (payload.role !== "agent") {
      return reply.code(403).send({ message: "Only seller accounts can access the seller dashboard" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service not configured" });
    }

    // Check account is not suspended
    const { data: profile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("suspended")
      .eq("user_id", payload.sub)
      .single();

    if (profile?.suspended) {
      return reply.code(403).send({ message: "Account is suspended" });
    }

    // Generate a cryptographically random token
    const rawToken = randomBytes(SSO_TOKEN_BYTES).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SSO_TOKEN_TTL_SECONDS * 1000).toISOString();

    // Invalidate any existing unused tokens for this user (only one active at a time)
    await (supabaseAdmin as any)
      .from("sso_tokens")
      .delete()
      .eq("user_id", payload.sub)
      .is("used_at", null);

    // Store the hashed token
    const { error: insertErr } = await (supabaseAdmin as any)
      .from("sso_tokens")
      .insert({
        user_id: payload.sub,
        token_hash: tokenHash,
        target_app: "agents",
        expires_at: expiresAt,
      });

    if (insertErr) {
      request.log.error(insertErr, "Failed to create SSO token");
      return reply.code(500).send({ message: "Failed to generate SSO token" });
    }

    // Clean up expired tokens (fire-and-forget maintenance)
    (supabaseAdmin as any)
      .from("sso_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .then(() => {})
      .catch((err: unknown) => request.log.error(err, "SSO cleanup error"));

    return { token: rawToken, expiresIn: SSO_TOKEN_TTL_SECONDS };
  });

  // POST /sso/exchange — Exchange a one-time SSO token for a session JWT
  app.post("/sso/exchange", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = z.object({
      token: z.string().min(1).max(256),
      targetApp: z.string().min(1).max(50).default("agents"),
    }).safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "Invalid request" });
    }

    const { token: rawToken, targetApp } = body.data;
    const tokenHash = hashToken(rawToken);

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return reply.code(503).send({ message: "Auth service not configured" });
    }

    // Find the token by hash — must be unused and not expired
    const { data: ssoRow, error: findErr } = await (supabaseAdmin as any)
      .from("sso_tokens")
      .select("id, user_id, target_app, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .single();

    if (findErr || !ssoRow) {
      return reply.code(401).send({ message: "Invalid or expired SSO token" });
    }

    // Check expiry
    if (new Date(ssoRow.expires_at) < new Date()) {
      // Mark as used to prevent future attempts
      await (supabaseAdmin as any)
        .from("sso_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", ssoRow.id);
      return reply.code(401).send({ message: "SSO token has expired" });
    }

    // Check target app matches
    if (ssoRow.target_app !== targetApp) {
      return reply.code(403).send({ message: "Token not valid for this application" });
    }

    // Immediately mark as used (single-use: prevents replay even on concurrent requests)
    const { data: markResult } = await (supabaseAdmin as any)
      .from("sso_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", ssoRow.id)
      .is("used_at", null)  // Atomic check — only succeeds if still unused
      .select("id")
      .single();

    if (!markResult) {
      // Another concurrent request already used this token
      return reply.code(401).send({ message: "SSO token already used" });
    }

    const userId = ssoRow.user_id;

    // Verify the user still exists, is an agent, and is not suspended
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authErr || !authUser?.user) {
      return reply.code(401).send({ message: "User account not found" });
    }

    const meta = authUser.user.user_metadata ?? {};
    const role = String(meta.role ?? "buyer");
    const name = String(meta.name ?? "");
    const email = authUser.user.email ?? "";

    if (role !== "agent") {
      return reply.code(403).send({ message: "Only seller accounts can access the seller dashboard" });
    }

    // Check suspension
    const { data: profile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("suspended")
      .eq("user_id", userId)
      .single();

    if (profile?.suspended) {
      return reply.code(403).send({ message: "Account is suspended" });
    }

    // Fetch agent record
    const { data: agentRecord } = await (supabaseAdmin as any)
      .from("agents")
      .select("id, name, company, phone, verified, rating, areas, years, color")
      .eq("user_id", userId)
      .single();

    // Issue a fresh JWT for the target app
    const sessionToken = app.jwt.sign(
      { sub: userId, email, role, name },
      { expiresIn: "7d" }
    );

    return {
      token: sessionToken,
      user: { id: userId, email, name, role },
      agent: agentRecord ?? null,
    };
  });
}
