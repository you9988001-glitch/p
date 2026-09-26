import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(projectRoot, "validation-key.txt");
const dest = join(projectRoot, "public", "validation-key.txt");

if (!existsSync(src)) {
  console.error(
    "[validation-key] Missing validation-key.txt at project root (Pi Portal).",
  );
  process.exit(1);
}
const key = readFileSync(src, "utf8").trim();
if (!key) {
  console.error("[validation-key] validation-key.txt is empty.");
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("[validation-key] synced to public/ for https://…/validation-key.txt");
