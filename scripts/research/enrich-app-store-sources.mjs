import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "docs/research/store-rankings/app-store-expanded-unique-apps.jsonl");
const OUTPUT = path.join(ROOT, "docs/research/source-enrichment/app-store-lookup.jsonl");
const BATCH_SIZE = 100;

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function lookup(ids, country) {
  const url = new URL("https://itunes.apple.com/lookup");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("country", country);
  url.searchParams.set("entity", "software");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": "oneul-idea-source-audit/1.0" },
      signal: AbortSignal.timeout(60_000),
    });
    if (response.ok) return response.json();
    if (attempt === 4) throw new Error(`iTunes lookup failed: ${response.status} ${url}`);
    await sleep(500 * (2 ** attempt));
  }
  throw new Error("iTunes lookup retry exhausted");
}

function compact(result, country) {
  return {
    app_id: String(result.trackId),
    country,
    track_name: result.trackName || null,
    seller_name: result.sellerName || null,
    primary_genre: result.primaryGenreName || null,
    genres: result.genres || [],
    description: result.description || null,
    release_notes: result.currentVersionReleaseNotes || null,
    version: result.version || null,
    price: result.price ?? null,
    currency: result.currency || null,
    average_user_rating: result.averageUserRating ?? null,
    user_rating_count: result.userRatingCount ?? null,
    url: result.trackViewUrl || null,
    fetched_at: new Date().toISOString(),
  };
}

const sources = readJsonl(INPUT);
const existing = fs.existsSync(OUTPUT) ? readJsonl(OUTPUT) : [];
const byId = new Map(existing.map((row) => [String(row.app_id), row]));
const pending = sources
  .map((row) => String(row.app_id))
  .filter((id) => !byId.has(id));

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

for (let start = 0; start < pending.length; start += BATCH_SIZE) {
  const ids = pending.slice(start, start + BATCH_SIZE);
  const us = await lookup(ids, "us");
  const found = new Set();
  for (const result of us.results || []) {
    const row = compact(result, "us");
    byId.set(row.app_id, row);
    found.add(row.app_id);
  }

  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) {
    const kr = await lookup(missing, "kr");
    for (const result of kr.results || []) {
      const row = compact(result, "kr");
      byId.set(row.app_id, row);
      found.add(row.app_id);
    }
  }

  for (const id of ids) {
    if (!byId.has(id)) {
      byId.set(id, {
        app_id: id,
        country: null,
        description: null,
        lookup_status: "not_found",
        fetched_at: new Date().toISOString(),
      });
    }
  }

  const ordered = sources.map((row) => byId.get(String(row.app_id))).filter(Boolean);
  fs.writeFileSync(OUTPUT, `${ordered.map((row) => JSON.stringify(row)).join("\n")}\n`);
  process.stdout.write(`\rApp Store enrichment ${Math.min(start + ids.length, pending.length)}/${pending.length}`);
  await sleep(120);
}

const finalRows = sources.map((row) => byId.get(String(row.app_id))).filter(Boolean);
const described = finalRows.filter((row) => String(row.description || "").trim().length >= 80).length;
process.stdout.write("\n");
console.log(JSON.stringify({
  source_rows: sources.length,
  enrichment_rows: finalRows.length,
  described,
  not_found: finalRows.filter((row) => row.lookup_status === "not_found").length,
  output: path.relative(ROOT, OUTPUT),
}, null, 2));
