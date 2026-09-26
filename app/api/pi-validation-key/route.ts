import { readFile } from "fs/promises";
import { join } from "path";

/** Pi Portal step 7 — exposed at /validation-key.txt via next.config rewrite. */
export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "validation-key.txt");
    const body = (await readFile(filePath, "utf8")).trim();
    if (!body) {
      return new Response("Not Found", { status: 404 });
    }
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
