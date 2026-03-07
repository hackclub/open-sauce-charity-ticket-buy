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
import { renderLeaderboard } from "./web";
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

// -- HTTP Server --
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(renderLeaderboard(getDonations()), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/leaderboard.png") {
      const cached = getLeaderboardPng();
      if (cached) {
        return new Response(cached, {
          headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=5" },
        });
      }
      const png = await renderLeaderboardImage(getDonations());
      setLeaderboardPng(png);
      return new Response(png, {
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=5" },
      });
    }

    if (url.pathname === "/api/donations") {
      return Response.json(getDonations());
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
