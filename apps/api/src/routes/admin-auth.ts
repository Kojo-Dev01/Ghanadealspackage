import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../lib/supabase.js";
import type { AdminRole } from "../lib/permissions.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function registerAdminAuthRoutes(app: FastifyInstance) {
  app.post("/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid login payload" });
    }

    const supabaseClient = getSupabaseServerClient();
    const supabaseAdminClient = getSupabaseAdminClient();

    if (!supabaseClient || !supabaseAdminClient) {
      return reply.code(503).send({
        message: "Supabase auth is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
      });
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword(body.data);

    if (error || !data.user || !data.session) {
      return reply.code(401).send({ message: "Invalid admin credentials" });
    }

    // Look up role from admin_users table (not JWT / user_metadata)
    const { data: adminRow, error: adminErr } = await supabaseAdminClient
      .from("admin_users")
      .select("id, role, active, name")
      .eq("user_id", data.user.id)
      .single();

    if (adminErr || !adminRow) {
      return reply.code(403).send({ message: "User does not have admin access" });
    }

    if (!(adminRow as { active: boolean }).active) {
      return reply.code(403).send({ message: "Admin account has been deactivated" });
    }

    const role = (adminRow as { role: AdminRole }).role;

    const token = app.jwt.sign({
      sub: data.user.id,
      email: data.user.email,
      role
    }, {
      expiresIn: "8h"
    });

    return {
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        name: (adminRow as { name: string }).name
      }
    };
  });
}