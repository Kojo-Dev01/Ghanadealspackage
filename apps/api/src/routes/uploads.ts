import type { FastifyInstance } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif",
  "application/pdf",
]);

// Lazy-init so env vars are available after dotenv.config() in server.ts
let _client: S3Client | null = null;
function getS3Client() {
  if (!_client) {
    _client = new S3Client({
      region: process.env.WASABI_REGION,
      endpoint: process.env.WASABI_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _client;
}

export async function registerUploadRoutes(app: FastifyInstance) {
  // Direct file upload — accepts multipart/form-data with a "file" field
  // and an optional "folder" text field (default: "properties")
  app.post("/file", async (request, reply) => {
    // Auth
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Not authenticated" });
    }
    const user = request.user as { sub: string; role: string };
    if (user.role !== "agent" && user.role !== "admin") {
      return reply.code(403).send({ message: "Upload access denied" });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ message: "No file provided" });
    }

    if (!ALLOWED_TYPES.has(data.mimetype)) {
      return reply.code(400).send({ message: "Unsupported file type. Use JPG, PNG, WebP, or PDF." });
    }

    const bucket = process.env.WASABI_BUCKET;
    if (!bucket) {
      return reply.code(500).send({ message: "Storage is not configured" });
    }

    // Build object key: folder/timestamp-random.ext
    const folder = (data.fields.folder as any)?.value || "properties";
    const ext = data.filename.split(".").pop() ?? "jpg";
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = await data.toBuffer();

    await getS3Client().send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: data.mimetype,
    }));

    // Path-style URL (avoids SSL issues when bucket name contains dots)
    const endpoint = process.env.WASABI_ENDPOINT ?? "https://s3.wasabisys.com";
    const url = `${endpoint}/${bucket}/${key}`;

    return { url, key };
  });
}
