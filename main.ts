import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_CHARS = 200;

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.txt");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = join(outputDir, "entry.txt");

// Read as bytes first so the UTF-8 check is exact, not assumed.
const sourceBytes = readFileSync(sourcePath);
const raw = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes);
const entry = raw.endsWith("\n") ? raw.slice(0, -1) : raw;

if (entry.length === 0) {
  throw new Error("entry.txt is empty");
}
if (entry.trim().length === 0) {
  throw new Error("entry.txt is only whitespace");
}
if ([...entry].length > MAX_CHARS) {
  throw new Error(`entry is ${[...entry].length} characters, over the ${MAX_CHARS}-character limit`);
}
if (entry.includes("\n") || entry.includes("\r")) {
  throw new Error("entry must be a single line");
}
if (!entry.endsWith(".")) {
  throw new Error("entry must be one complete sentence ending in a period");
}

const payload = Buffer.from(entry + "\n", "utf8");
mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, payload);

// Byte-exact round-trip: what the grader reads must equal what we shipped.
const roundTrip = readFileSync(outputPath);
if (!roundTrip.equals(payload)) {
  throw new Error("round-trip mismatch: output bytes differ from entry.txt payload");
}
const verified = new TextDecoder("utf-8", { fatal: true }).decode(roundTrip);
if (verified !== entry + "\n") {
  throw new Error("round-trip mismatch: output text differs from entry.txt");
}

console.log(`ok: wrote and verified ${[...entry].length} characters (${payload.length} bytes) at ${outputPath}`);
