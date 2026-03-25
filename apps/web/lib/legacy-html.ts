import { readFile } from "node:fs/promises";
import path from "node:path";

function extractBody(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

export async function getLegacyBodyHtml() {
  const filePath = path.join(process.cwd(), "public", "legacy", "index.html");
  const html = await readFile(filePath, "utf-8");
  const body = extractBody(html)
    .replace(/\.\/assets\//g, "/legacy/assets/")
    .replace(/\.\/app\.js/g, "/legacy/app.js")
    .replace(/<script[^>]*src=["']\.\/app\.js["'][^>]*><\/script>/gi, "");

  return body;
}
