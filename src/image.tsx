import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { AirtableTransaction } from "./airtable";
import { mergeDonations, type MergedDonor } from "./store";

let juaFont: ArrayBuffer | null = null;
let notoFont: ArrayBuffer | null = null;

async function loadFonts(): Promise<{ jua: ArrayBuffer; noto: ArrayBuffer }> {
  const [jua, noto] = await Promise.all([
    juaFont ?? fetch("https://fonts.gstatic.com/s/jua/v16/co3KmW9ljjAjc-DZCsKgsg.ttf").then(r => r.arrayBuffer()),
    notoFont ?? fetch("https://fonts.gstatic.com/s/notosans/v39/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9a6Vc.ttf").then(r => r.arrayBuffer()),
  ]);
  juaFont = jua;
  notoFont = noto;
  return { jua, noto };
}

function formatMoney(amount: number, decimals = true): string {
  if (!decimals) return "$" + Math.round(amount).toLocaleString("en-US");
  return "$" + amount.toLocaleString("en-US");
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function rankStyle(rank: number): { backgroundImage?: string; background?: string; color: string } {
  if (rank === 1) return { backgroundImage: "linear-gradient(135deg, #d4af37, #f2d06b)", color: "#5c3d0e" };
  if (rank === 2) return { backgroundImage: "linear-gradient(135deg, #8a8a8a, #c0c0c0)", color: "#333333" };
  if (rank === 3) return { backgroundImage: "linear-gradient(135deg, #8c5a2e, #c48a52)", color: "#f8e8d1" };
  return { background: "#ad7858", color: "#f8e8d1" };
}

function Card({
  rank,
  name,
  amount,
  time,
}: {
  rank: number;
  name: string | null;
  amount: number | null;
  time: string;
}) {
  const medal = rankStyle(rank);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        background: "#7a4841",
        border: "6px solid #ad7858",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 4px 0 0 #4d2b32",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...medal,
            borderRadius: "50%",
            width: 64,
            height: 64,
            fontSize: 32,
            flexShrink: 0,
          }}
        >
          {rank}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 26,
              color: "#f8e8d1",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name || "---"}
          </div>
          {time && (
            <div style={{ fontSize: 15, color: "rgba(248,232,209,0.6)" }}>
              {time}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 26, color: "#f8e8d1", flexShrink: 0 }}>
        {amount !== null ? formatMoney(amount) : "---"}
      </div>
    </div>
  );
}

function Footer({ now }: { now: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        fontSize: 18,
        color: "rgba(122,72,65,0.7)",
      }}
    >
      <div style={{ display: "flex" }}>hack.club/opensauce</div>
      <div style={{ display: "flex" }}>{`Last updated: ${now}`}</div>
    </div>
  );
}

function TotalRaisedHeader({ totalRaised }: { totalRaised: number }) {
  return (
    <div style={{ display: "flex", marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
          background: "#7a4841",
          border: "6px solid #ad7858",
          borderRadius: 20,
          padding: "16px 24px",
          gap: 8,
          boxShadow: "0 4px 0 0 #4d2b32",
        }}
      >
        <div style={{ fontSize: 18, color: "rgba(248,232,209,0.7)" }}>
          Total Raised
        </div>
        <div style={{ fontSize: 42, color: "#f8e8d1" }}>
          {formatMoney(totalRaised, false)}
        </div>
      </div>
    </div>
  );
}

function getNow(): string {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles",
  }) + " Los Angeles time";
}

/** Active view: donations are flowing (most recent < 24h ago) */
function ActiveLeaderboard({ donations }: { donations: AirtableTransaction[] }) {
  const allTime = mergeDonations(donations)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const recent = [...donations]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
  const now = getNow();
  const rows = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#f8e8d1",
        border: "12px solid #ad7858",
        borderRadius: 40,
        padding: 40,
        width: 1000,
        boxShadow: "0 8px 0 0 #c4a882",
        fontFamily: "Jua, Noto Sans",
      }}
    >
      <TotalRaisedHeader totalRaised={totalRaised} />

      <div style={{ display: "flex", gap: 24 }}>
        {/* All Time */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
          <div
            style={{
              fontSize: 32,
              color: "#7a4841",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Top 5 Donors
          </div>
          {rows.map((i) => (
            <Card
              key={i}
              rank={i + 1}
              name={allTime[i]?.name || null}
              amount={allTime[i]?.amount ?? null}
              time={allTime[i] ? formatDate(allTime[i].latestDate) : ""}
            />
          ))}
        </div>
        {/* Most Recent */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
          <div
            style={{
              fontSize: 32,
              color: "#7a4841",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Most Recent
          </div>
          {rows.map((i) => (
            <Card
              key={i}
              rank={i + 1}
              name={recent[i]?.name || null}
              amount={recent[i]?.amount ?? null}
              time={recent[i] ? timeAgo(recent[i].date) : ""}
            />
          ))}
        </div>
      </div>

      <Footer now={now} />
    </div>
  );
}

/** Quiet view: no donations for a while (most recent > 24h ago) */
function QuietLeaderboard({ donations }: { donations: AirtableTransaction[] }) {
  const allTime = mergeDonations(donations)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalDonors = mergeDonations(donations).length;
  const now = getNow();

  const mostRecent = [...donations].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
  const lastDonationDate = mostRecent ? formatDate(mostRecent.date) : "";

  const leftCol = allTime.slice(0, 5);
  const rightCol = allTime.slice(5, 10);
  const rows = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#f8e8d1",
        border: "12px solid #ad7858",
        borderRadius: 40,
        padding: 40,
        width: 1000,
        boxShadow: "0 8px 0 0 #c4a882",
        fontFamily: "Jua, Noto Sans",
      }}
    >
      <TotalRaisedHeader totalRaised={totalRaised} />

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          marginBottom: 20,
          fontSize: 20,
          color: "#7a4841",
        }}
      >
        <div style={{ display: "flex" }}>{totalDonors} donors</div>
        <div style={{ display: "flex" }}>Last donation: {lastDonationDate}</div>
      </div>

      {/* Section header */}
      <div
        style={{
          fontSize: 32,
          color: "#7a4841",
          textAlign: "center",
          marginBottom: 16,
          display: "flex",
          justifyContent: "center",
        }}
      >
        Top Donors
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Left column: ranks 1-5 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
          {rows.map((i) => (
            <Card
              key={i}
              rank={i + 1}
              name={leftCol[i]?.name || null}
              amount={leftCol[i]?.amount ?? null}
              time={leftCol[i] ? formatDate(leftCol[i].latestDate) : ""}
            />
          ))}
        </div>
        {/* Right column: ranks 6-10 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
          {rows.map((i) => (
            <Card
              key={i}
              rank={i + 6}
              name={rightCol[i]?.name || null}
              amount={rightCol[i]?.amount ?? null}
              time={rightCol[i] ? formatDate(rightCol[i].latestDate) : ""}
            />
          ))}
        </div>
      </div>

      <Footer now={now} />
    </div>
  );
}

function Leaderboard({ donations }: { donations: AirtableTransaction[] }) {
  const mostRecent = [...donations].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
  const hoursSinceLastDonation = mostRecent
    ? (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60)
    : Infinity;

  const isActive = hoursSinceLastDonation < 24;

  if (isActive) {
    return <ActiveLeaderboard donations={donations} />;
  }
  return <QuietLeaderboard donations={donations} />;
}

export async function renderLeaderboardImage(
  donations: AirtableTransaction[]
): Promise<Buffer> {
  const { jua, noto } = await loadFonts();

  const svg = await satori(<Leaderboard donations={donations} />, {
    width: 1000,
    height: 1100,
    fonts: [
      {
        name: "Jua",
        data: jua,
        weight: 400,
        style: "normal",
      },
      {
        name: "Noto Sans",
        data: noto,
        weight: 400,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 2000 },
  });
  const rendered = resvg.render();
  const { width, height } = rendered;
  const pixels = rendered.pixels; // RGBA Uint8Array

  // Find the last row with any non-transparent pixel
  let bottomRow = 0;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] > 0) {
        bottomRow = y;
        y = -1; // break outer
        break;
      }
    }
  }

  const cropH = bottomRow + 1;
  if (cropH >= height) {
    return Buffer.from(rendered.asPng());
  }

  // Crop by adjusting the SVG height proportionally and re-rendering
  const svgHeight = 1100;
  const scale = height / svgHeight; // rendered px per svg unit
  const newSvgHeight = Math.ceil(cropH / scale);
  const croppedSvg = svg
    .replace(/height="[^"]*"/, `height="${newSvgHeight}"`)
    .replace(
      /viewBox="([^"]*)"/,
      (_, vb) => {
        const parts = vb.split(/\s+/);
        if (parts.length === 4) {
          parts[3] = String(newSvgHeight);
          return `viewBox="${parts.join(" ")}"`;
        }
        return `viewBox="0 0 1000 ${newSvgHeight}"`;
      }
    );
  const resvg2 = new Resvg(croppedSvg, {
    fitTo: { mode: "width", value: 2000 },
  });
  return Buffer.from(resvg2.render().asPng());
}
