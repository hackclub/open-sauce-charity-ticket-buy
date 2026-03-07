import type { AirtableTransaction } from "./airtable";

function formatMoney(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
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

function renderRow(rank: number, donation: AirtableTransaction | null, useTimeAgo: boolean): string {
  const name = donation?.name || "---";
  const amount = donation?.amount != null ? formatMoney(donation.amount) : "---";
  const dateStr = donation
    ? useTimeAgo ? timeAgo(donation.date) : formatDate(donation.date)
    : "";
  return `
    <div class="card">
      <div class="rank-circle">${rank}</div>
      <div class="info">
        <span class="name">${escapeHtml(name)}</span>
        ${dateStr ? `<span class="date">${escapeHtml(dateStr)}</span>` : ""}
      </div>
      <div class="amount">${escapeHtml(amount)}</div>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderLeaderboard(donations: AirtableTransaction[]): string {
  const allTime = [...donations]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recent = donations
    .filter((d) => d.date && new Date(d.date).getTime() > oneDayAgo)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const allTimeRows = Array.from({ length: 5 }, (_, i) =>
    renderRow(i + 1, allTime[i] || null, false)
  ).join("");

  const recentRows = Array.from({ length: 5 }, (_, i) =>
    renderRow(i + 1, recent[i] || null, true)
  ).join("");

  const now = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/Los_Angeles",
  }) + " Los Angeles time";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Open Sauce Charity Ticket Buy - Leaderboard</title>
<link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Jua', sans-serif;
    background: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
  }

  .container {
    background: #f8e8d1;
    border: 12px solid #ad7858;
    border-radius: 40px;
    padding: 40px;
    max-width: 1000px;
    width: 100%;
    box-shadow: 0 8px 0 0 #c4a882;
  }

  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }

  @media (max-width: 700px) {
    .columns { grid-template-columns: 1fr; }
  }

  .column h2 {
    font-size: 32px;
    color: #7a4841;
    text-align: center;
    margin-bottom: 16px;
    text-shadow: -2px 3px 1px rgba(0,0,0,0.15);
    font-weight: 400;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .card {
    background: #7a4841;
    border: 6px solid #ad7858;
    border-radius: 20px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 0 0 #4d2b32;
  }

  .rank-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #ad7858;
    color: #f8e8d1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    flex-shrink: 0;
    text-shadow: -2px 3px 1px rgba(0,0,0,0.25);
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    color: #f8e8d1;
    font-size: 26px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: -2px 3px 1px rgba(0,0,0,0.25);
    font-weight: 400;
  }

  .date {
    color: rgba(248,232,209,0.6);
    font-size: 15px;
    font-weight: 400;
  }

  .amount {
    color: #f8e8d1;
    font-size: 26px;
    white-space: nowrap;
    flex-shrink: 0;
    text-shadow: -2px 3px 1px rgba(0,0,0,0.25);
    font-weight: 400;
  }

  .updated {
    text-align: right;
    color: rgba(122,72,65,0.7);
    font-size: 18px;
    font-weight: 400;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="columns">
      <div class="column">
        <h2>Top 5 All Time</h2>
        <div class="cards">${allTimeRows}</div>
      </div>
      <div class="column">
        <h2>Top 5 Past 24 Hours</h2>
        <div class="cards">${recentRows}</div>
      </div>
    </div>
    <div class="updated">Last updated: ${escapeHtml(now)}</div>
  </div>
</body>
</html>`;
}
