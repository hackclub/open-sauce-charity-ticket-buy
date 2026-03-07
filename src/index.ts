import { fetchTransactions, fetchDonations, type HcbTransaction } from "./hcb";
import { fetchAllRecords, createRecord } from "./airtable";
import { classifyTransaction } from "./ai";
import {
  getDonations,
  getTransactions,
  getLeaderboardPng,
  setLeaderboardPng,
  isHcbIdKnown,
  addKnownHcbId,
  replaceTransactions,
  withLock,
} from "./store";
import { renderLeaderboard, renderApiDocs, renderOgMetaRedirect } from "./web";
import { renderLeaderboardImage } from "./image";

const PORT = parseInt(process.env.PORT || "3000");
const HCB_POLL_INTERVAL = 5_000;
const AIRTABLE_SYNC_INTERVAL = 30_000;

// -- Regenerate leaderboard image --
async function regenerateImage() {
  try {
    console.log("[image] regenerating leaderboard...");
    const png = await renderLeaderboardImage(getDonations());
    setLeaderboardPng(png);
    console.log("[image] done");
  } catch (err) {
    console.error("[image] generation failed:", err);
  }
}

// -- Sync Airtable -> RAM -> regenerate image --
async function syncFromAirtable() {
  await withLock(async () => {
    console.log("[airtable] syncing to RAM...");
    const records = await fetchAllRecords();
    replaceTransactions(records);
    console.log(`[airtable] loaded ${records.length} transactions into RAM (${getDonations().length} donations)`);
  });
  await regenerateImage();
}

// -- Poll HCB for new transactions -> AI classify -> Airtable --
async function pollHcb() {
  try {
    const [hcbTransactions, hcbDonations] = await Promise.all([
      fetchTransactions(),
      fetchDonations(),
    ]);

    // Build a map from transaction ID to donor info
    const donorByTxnId = new Map<string, { name: string; anonymous: boolean }>();
    for (const d of hcbDonations) {
      donorByTxnId.set(d.transaction.id, d.donor);
    }

    const newOnes: HcbTransaction[] = [];
    for (const t of hcbTransactions) {
      if (!isHcbIdKnown(t.id)) {
        newOnes.push(t);
      }
    }
    if (newOnes.length === 0) {
      console.log(`[hcb] polled ${hcbTransactions.length} transactions, no new ones`);
      return;
    }

    console.log(`[hcb] found ${newOnes.length} new transaction(s)`);

    for (const t of newOnes) {
      addKnownHcbId(t.id);

      const donor = donorByTxnId.get(t.id);
      const rawName = donor
        ? donor.anonymous ? "" : donor.name
        : "";

      let result: { isDonation: boolean; displayName: string };
      try {
        result = await classifyTransaction({
          memo: t.memo,
          type: t.type,
          amountCents: t.amount_cents,
          donorName: rawName || undefined,
        });
      } catch (err) {
        console.error("[ai] classification failed, falling back:", err);
        result = {
          isDonation: t.type === "donation" && t.amount_cents > 0,
          displayName: rawName || "Anonymous Donor",
        };
      }

      await withLock(async () => {
        await createRecord({
          Name: result.displayName,
          Amount: Math.abs(t.amount_cents) / 100,
          "First Seen": new Date().toISOString(),
          "HCB Donation ID": t.id,
          "Raw Donor Name": rawName || t.memo,
          Memo: t.memo,
          "Show Publicly As Donation": result.isDonation,
          "HCB Raw Transaction Type": t.type,
          "HCB Ledger Date": t.date,
        });
        const tag = result.isDonation ? "donation" : t.type;
        console.log(`[airtable] created [${tag}] ${result.displayName} ($${Math.abs(t.amount_cents) / 100})`);
      });
    }

    await syncFromAirtable();
  } catch (err) {
    console.error("[hcb] poll error:", err);
  }
}

// -- Request stats --
let reqCount = 0;
let statsStart = Date.now();
const ipCounts = new Map<string, number>();

const STATS_INTERVAL = 30_000;
setInterval(() => {
  const elapsed = (Date.now() - statsStart) / 1000;
  const rps = elapsed > 0 ? (reqCount / elapsed).toFixed(2) : "0";
  const top3 = [...ipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ip, count]) => `${ip}(${count})`)
    .join(", ") || "none";
  console.log(`[stats] ${reqCount} reqs in ${Math.round(elapsed)}s (${rps} rps) | top IPs: ${top3}`);
  reqCount = 0;
  ipCounts.clear();
  statsStart = Date.now();
}, STATS_INTERVAL);

// -- Client IP extraction (Cloudflare -> Traefik -> container) --
function getClientIp(req: Request, fallbackIp: string): string {
  // Cloudflare sets this to the real visitor IP
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Traefik / standard reverse proxy
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return fallbackIp;
}

// -- Rate limiting: 5 req/s for pages/API, 25 req/s for assets --
const RATE_WINDOW = 1000;
const pageRateMap = new Map<string, number[]>();
const PAGE_RATE_LIMIT = 5;
const assetRateMap = new Map<string, number[]>();
const ASSET_RATE_LIMIT = 25;

function isRateLimited(ip: string, isAsset: boolean): boolean {
  const map = isAsset ? assetRateMap : pageRateMap;
  const limit = isAsset ? ASSET_RATE_LIMIT : PAGE_RATE_LIMIT;
  const now = Date.now();
  let timestamps = map.get(ip);
  if (!timestamps) {
    timestamps = [];
    map.set(ip, timestamps);
  }
  while (timestamps.length > 0 && timestamps[0] <= now - RATE_WINDOW) {
    timestamps.shift();
  }
  if (timestamps.length >= limit) return true;
  timestamps.push(now);
  return false;
}

// Clean up rate maps periodically
setInterval(() => {
  const now = Date.now();
  for (const map of [pageRateMap, assetRateMap]) {
    for (const [ip, timestamps] of map) {
      while (timestamps.length > 0 && timestamps[0] <= now - RATE_WINDOW) {
        timestamps.shift();
      }
      if (timestamps.length === 0) map.delete(ip);
    }
  }
}, 10_000);

// -- HTTP Server --
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const ip = getClientIp(req, server.requestIP(req)?.address ?? "unknown");
    reqCount++;
    ipCounts.set(ip, (ipCounts.get(ip) ?? 0) + 1);
    const isAsset = url.pathname !== "/" && !url.pathname.startsWith("/api");
    if (isRateLimited(ip, isAsset)) {
      return new Response("Too Many Requests", { status: 429 });
    }

    if (url.pathname === "/favicon.png") {
      return new Response(Bun.file(import.meta.dir + "/favicon.png"));
    }

    if (url.pathname === "/og-meta-redirect") {
      return new Response(renderOgMetaRedirect(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/") {
      return new Response(renderLeaderboard(getDonations()), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api") {
      const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
      const baseUrl = `${proto}://${url.host}`;
      return new Response(renderApiDocs(baseUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/leaderboard.png") {
      const cached = getLeaderboardPng();
      if (cached) {
        return new Response(cached, {
          headers: { "Content-Type": "image/png", "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      }
      const png = await renderLeaderboardImage(getDonations());
      setLeaderboardPng(png);
      return new Response(png, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    if (url.pathname === "/api/donations") {
      return Response.json(getDonations().map(d => ({
        name: d.name,
        amount: d.amount,
        date: d.date,
      })));
    }

    if (url.pathname === "/api/transactions") {
      return Response.json(getTransactions());
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);

// -- Startup --
await syncFromAirtable();

setInterval(pollHcb, HCB_POLL_INTERVAL);
setInterval(syncFromAirtable, AIRTABLE_SYNC_INTERVAL);

pollHcb();
