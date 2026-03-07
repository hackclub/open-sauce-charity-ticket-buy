import type { AirtableTransaction } from "./airtable";
import { readFileSync } from "fs";
import { join } from "path";

const qrSvg = readFileSync(join(import.meta.dir, "qr.svg"), "utf-8");

export function renderOgMetaRedirect(): string {
  const redirectUrl = "https://forms.hackclub.com/t/eLhFehpKG6us?utm_campaign=opensauce";
  const imageUrl = "https://cdn.hackclub.com/019cc74b-6f0e-7562-8338-6a59e01dbf47/meta.jpg";
  const title = "Open Sauce Charity Ticket Buy";
  const description = "Donate to send students to Open Sauce! Tax deductible in the US.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="https://cdn.hackclub.com/019cc756-d5d7-7c31-a090-4ef232e60b36/meta-x.png">
<script>window.location.replace("${redirectUrl}");</script>
<link rel="icon" type="image/png" href="/favicon.png">
<style>
  body { margin: 0; background: #F8EFD9; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
  p { opacity: 0; animation: show 0s 3s forwards; }
  @keyframes show { to { opacity: 1; } }
</style>
</head>
<body>
<p>Redirecting to <a href="${redirectUrl}">${redirectUrl}</a>...</p>
</body>
</html>`;
}

export function renderApiDocs(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>API Docs - Open Sauce Charity Ticket Buy</title>
<link rel="icon" type="image/png" href="/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Jua&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --cream: #f8e8d1;
    --brown-dark: #7a4841;
    --brown-mid: #ad7858;
    --brown-deep: #4d2b32;
    --bg: #F8EFD9;
  }
  body {
    font-family: 'Jua', sans-serif;
    background: var(--bg);
    color: var(--brown-dark);
    min-height: 100vh;
    padding: 32px 20px 60px;
  }
  .container {
    max-width: 720px;
    margin: 0 auto;
  }
  .back {
    display: inline-block;
    color: var(--brown-mid);
    text-decoration: none;
    font-size: 15px;
    margin-bottom: 20px;
  }
  .back:hover { text-decoration: underline; }
  h1 {
    font-size: 36px;
    color: var(--brown-dark);
    margin-bottom: 8px;
  }
  .subtitle {
    font-size: 16px;
    color: var(--brown-mid);
    margin-bottom: 32px;
  }
  h2 {
    font-size: 24px;
    color: var(--brown-dark);
    margin: 32px 0 12px;
    padding-top: 16px;
    border-top: 2px solid var(--brown-mid);
  }
  h2:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
  p, li {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #5a3a34;
    margin-bottom: 12px;
  }
  ul { padding-left: 20px; margin-bottom: 16px; }
  li { margin-bottom: 6px; }
  code {
    font-family: 'IBM Plex Mono', monospace;
    background: rgba(173,120,88,0.12);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
    color: var(--brown-deep);
  }
  pre {
    font-family: 'IBM Plex Mono', monospace;
    background: var(--brown-dark);
    color: var(--cream);
    padding: 16px 20px;
    border-radius: 12px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 16px;
    border: 3px solid var(--brown-mid);
  }
  .method {
    display: inline-block;
    background: var(--brown-mid);
    color: var(--cream);
    padding: 2px 8px;
    border-radius: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    margin-right: 6px;
  }
  .endpoint {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 15px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
  }
  th, td {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(173,120,88,0.2);
  }
  th {
    color: var(--brown-dark);
    font-weight: 600;
    font-size: 13px;
  }
  td { color: #5a3a34; }
  td code { font-size: 13px; }
</style>
</head>
<body>
<div class="container">
  <a href="/" class="back">&larr; Back to Leaderboard</a>
  <h1>API Documentation</h1>
  <p class="subtitle">Open Sauce Charity Ticket Buy</p>

  <h2>Embeddable Leaderboard Image</h2>
  <p>Embed a live leaderboard image anywhere (Slack, Discord, forums, emails, READMEs). The image updates automatically on the server.</p>
  <p><span class="method">GET</span> <span class="endpoint">/api/leaderboard.png</span></p>
  <p>Returns a PNG image (2000px wide). Embed it with an <code>&lt;img&gt;</code> tag:</p>
  <pre>&lt;img src="${baseUrl}/api/leaderboard.png" alt="Leaderboard" /&gt;</pre>
  <p>Or in Markdown:</p>
  <pre>![Leaderboard](${baseUrl}/api/leaderboard.png)</pre>

  <h2>Donations List</h2>
  <p>Get all donations.</p>
  <p><span class="method">GET</span> <span class="endpoint">/api/donations</span></p>
  <p>Returns a JSON array of donation objects:</p>
  <pre>[
  {
    "name": "Zach Latta",
    "amount": 100,
    "date": "2026-03-07T05:30:00.000Z"
  }
]</pre>
  <table>
    <tr><th>Field</th><th>Type</th><th>Description</th></tr>
    <tr><td><code>name</code></td><td>string</td><td>Donor display name</td></tr>
    <tr><td><code>amount</code></td><td>number</td><td>Donation amount in USD</td></tr>
    <tr><td><code>date</code></td><td>string</td><td>ISO 8601 timestamp of when the donation was first seen</td></tr>
  </table>

  <h2>Rate Limits</h2>
  <p>This infrastructure is managed by a nonprofit with minimal resources. We ask that you please not overwhelm our servers. There is a hard limit of <strong>5 requests per second</strong> per IP address. Requests exceeding this limit will receive a <code>429 Too Many Requests</code> response.</p>

</div>
</body>
</html>`;
}

export function renderLeaderboard(donations: AirtableTransaction[]): string {
  const initialData = JSON.stringify(donations.map(d => ({
    name: d.name,
    amount: d.amount,
    date: d.date,
  })));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Open Sauce Charity Ticket Buy</title>
<link rel="icon" type="image/png" href="/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --cream: #f8e8d1;
    --brown-dark: #7a4841;
    --brown-mid: #ad7858;
    --brown-deep: #4d2b32;
    --brown-light: #c4a882;
    --bg: #F8EFD9;
  }

  body {
    font-family: 'Jua', sans-serif;
    background: var(--bg);
    color: var(--brown-dark);
    min-height: 100vh;
    padding-bottom: 60px;
  }

  /* Header */
  .header {
    text-align: center;
    padding: 24px 20px 0;
  }
  .header img {
    width: 100%;
    max-width: 640px;
    border-radius: 16px;
  }

  .live-badge {
    position: fixed;
    top: 16px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--brown-mid);
    z-index: 10;
  }
  .api-link {
    position: fixed;
    bottom: 16px;
    right: 20px;
    color: var(--brown-mid);
    text-decoration: none;
    border: 2px solid var(--brown-mid);
    border-radius: 8px;
    padding: 3px 10px;
    font-size: 13px;
    z-index: 10;
    transition: background 0.15s, color 0.15s;
  }
  .api-link:hover {
    background: var(--brown-mid);
    color: var(--cream);
  }
  .refresh-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6abf69;
    animation: pulse 2s ease infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Total Raised */
  .total-wrap {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 20px;
    padding: 28px 20px 24px;
  }
  .total-card {
    background: var(--brown-dark);
    border: 5px solid var(--brown-mid);
    border-radius: 28px;
    padding: 24px 56px 20px;
    box-shadow: 0 5px 0 0 var(--brown-deep);
    text-align: center;
  }
  .total-label {
    font-size: 15px;
    color: var(--cream);
    opacity: 0.75;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .total-amount {
    font-size: 80px;
    color: var(--cream);
    text-shadow: -2px 4px 1px rgba(0,0,0,0.3);
    line-height: 1;
  }
  .total-donors {
    font-size: 15px;
    color: rgba(248,232,209,0.7);
    margin-top: 4px;
  }
  .donate-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    background: var(--cream);
    border: 5px solid var(--brown-mid);
    border-radius: 28px;
    padding: 16px 20px 14px;
    box-shadow: 0 5px 0 0 var(--brown-deep);
    transition: transform 0.15s;
  }
  .donate-qr:hover { transform: scale(1.04); }
  .donate-qr svg {
    width: 100px;
    height: 100px;
    border-radius: 0;
    flex-shrink: 0;
  }
  .donate-qr span {
    font-size: 15px;
    color: var(--brown-dark);
  }
  @media (max-width: 500px) {
    .total-wrap { flex-direction: column; }
  }

  /* Layout */
  .main {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 16px;
  }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 700px) {
    .columns { grid-template-columns: 1fr; }
  }

  /* Panels */
  .panel {
    background: var(--cream);
    border: 4px solid var(--brown-mid);
    border-radius: 24px;
    padding: 24px 20px;
    box-shadow: 0 5px 0 0 rgba(173,120,88,0.2);
  }
  .panel-title {
    font-size: 26px;
    color: var(--brown-dark);
    text-align: center;
    margin-bottom: 16px;
    text-shadow: -1px 2px 1px rgba(0,0,0,0.06);
  }

  /* Rows */
  .rows { display: flex; flex-direction: column; gap: 8px; }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--brown-dark);
    border: 3px solid var(--brown-mid);
    border-radius: 14px;
    padding: 12px 16px;
    box-shadow: 0 3px 0 0 var(--brown-deep);
  }

  .rank {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--brown-mid);
    color: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    text-shadow: -1px 2px 1px rgba(0,0,0,0.2);
  }
  .rank.gold { background: linear-gradient(135deg, #d4af37, #f2d06b); color: #5c3d0e; text-shadow: none; }
  .rank.silver { background: linear-gradient(135deg, #8a8a8a, #c0c0c0); color: #333; text-shadow: none; }
  .rank.bronze { background: linear-gradient(135deg, #8c5a2e, #c48a52); }

  .row-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .row-name {
    font-size: 18px;
    color: var(--cream);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: -1px 2px 1px rgba(0,0,0,0.2);
  }
  .row-date {
    font-size: 12px;
    color: rgba(248,232,209,0.45);
    font-weight: 400;
  }
  .row-amount {
    font-size: 20px;
    color: var(--cream);
    flex-shrink: 0;
    text-shadow: -1px 2px 1px rgba(0,0,0,0.2);
  }

  .empty-row { opacity: 0.3; }

  .donate-url {
    text-align: center;
    padding: 0 20px 28px;
    margin-top: 0;
  }
  .donate-url a {
    font-size: 28px;
    color: var(--brown-dark);
    text-decoration: none;
    text-shadow: -1px 2px 1px rgba(0,0,0,0.06);
  }
  .donate-url a:hover { text-decoration: underline; }

  .footer-link {
    text-align: center;
    padding: 32px 20px 0;
    font-size: 14px;
  }
  .footer-link a {
    color: var(--brown-mid);
    text-decoration: none;
  }
  .footer-link a:hover { text-decoration: underline; }
</style>
</head>
<body>

<div class="header">
  <a href="https://hack.club/opensauce"><img src="https://images.fillout.com/orgid-81/flowpublicid-eLhFehpKG6us/widgetid-xexU/ofUQhk5BnAhqRWyaxT3XkS/Group-247-(2).png?a=umwAPqS1BXFJ6qdL412GLv" alt="Open Sauce Charity Ticket Buy"></a>
</div>

<div class="total-wrap">
  <div class="total-card">
    <div class="total-label">Total Raised</div>
    <div class="total-amount" id="total-amount">$0</div>
    <div class="total-donors" id="total-donors"></div>
  </div>
  <a href="https://hcb.hackclub.com/donations/start/open-sauce-charity-ticket-buy" class="donate-qr">
    ${qrSvg}
    <span>Donate Now &rarr;</span>
  </a>
</div>

<div class="donate-url">
  <a href="https://hack.club/opensauce">hack.club/opensauce</a>
</div>

<div class="live-badge"><span class="refresh-dot"></span> Live <span id="countdown">10</span>s</div>
<a href="/api" class="api-link">API</a>

<div class="main">
  <div class="columns">
    <div class="panel">
      <div class="panel-title">All Time</div>
      <div class="rows" id="all-time-rows"></div>
    </div>
    <div class="panel">
      <div class="panel-title">Past 24 Hours</div>
      <div class="rows" id="recent-rows"></div>

    </div>
  </div>
</div>

<div class="footer-link">
  <a href="https://github.com/hackclub/open-sauce-charity-ticket-buy">open source on github</a>
</div>

<script>
const REFRESH_INTERVAL = 10_000;
const initialData = ${initialData};

function normalizeName(name) {
  return name.trim().replace(/\\s+/g, ' ').toLowerCase();
}

function mergeDonations(donations) {
  const map = new Map();
  for (const d of donations) {
    const key = normalizeName(d.name);
    const existing = map.get(key);
    if (existing) {
      existing.amount += d.amount;
      existing.count++;
      if (d.date > existing.latestDate) {
        existing.latestDate = d.date;
        existing.latestAmount = d.amount;
      }
    } else {
      map.set(key, {
        name: d.name,
        amount: d.amount,
        latestDate: d.date,
        latestAmount: d.amount,
        count: 1,
      });
    }
  }
  return Array.from(map.values());
}

function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return mins + ' minutes ago';
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return hours + ' hours ago';
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return days + ' days ago';
}

function esc(s) {
  const el = document.createElement('span');
  el.textContent = s;
  return el.innerHTML;
}

function rankClass(i) {
  if (i === 0) return 'rank gold';
  if (i === 1) return 'rank silver';
  if (i === 2) return 'rank bronze';
  return 'rank';
}

function renderRow(donor, index, useTimeAgo) {
  let dateStr = '';
  if (useTimeAgo) {
    const ago = timeAgo(donor.latestDate);
    dateStr = donor.count > 1
      ? formatMoney(donor.latestAmount) + ' more ' + ago
      : ago;
  } else {
    dateStr = formatDate(donor.latestDate);
  }
  return '<div class="row">'
    + '<div class="' + rankClass(index) + '">' + (index + 1) + '</div>'
    + '<div class="row-info">'
    + '<div class="row-name">' + esc(donor.name) + '</div>'
    + (dateStr ? '<div class="row-date">' + esc(dateStr) + '</div>' : '')
    + '</div>'
    + '<div class="row-amount">' + esc(formatMoney(donor.amount)) + '</div>'
    + '</div>';
}

function renderEmpty(index) {
  return '<div class="row empty-row">'
    + '<div class="rank">' + (index + 1) + '</div>'
    + '<div class="row-info"><div class="row-name">---</div></div>'
    + '<div class="row-amount">---</div>'
    + '</div>';
}

function render(donations) {
  const allTime = mergeDonations(donations).sort((a, b) => b.amount - a.amount);
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentDonations = donations.filter(d => d.date && new Date(d.date).getTime() > oneDayAgo);
  const recent = mergeDonations(recentDonations).sort((a, b) => b.amount - a.amount);

  // Total
  const totalAmount = allTime.reduce((sum, d) => sum + d.amount, 0);
  const totalDonors = allTime.length;
  document.getElementById('total-amount').textContent = formatMoney(totalAmount);
  document.getElementById('total-donors').textContent = totalDonors + ' donor' + (totalDonors !== 1 ? 's' : '');

  // All time
  let allHtml = '';
  for (let i = 0; i < allTime.length; i++) {
    allHtml += renderRow(allTime[i], i, false);
  }
  if (allTime.length === 0) {
    for (let i = 0; i < 5; i++) allHtml += renderEmpty(i);
  }
  document.getElementById('all-time-rows').innerHTML = allHtml;

  // Recent
  let recentHtml = '';
  for (let i = 0; i < recent.length; i++) {
    recentHtml += renderRow(recent[i], i, true);
  }
  if (recent.length === 0) {
    for (let i = 0; i < 3; i++) recentHtml += renderEmpty(i);
  }
  document.getElementById('recent-rows').innerHTML = recentHtml;

}

// Initial render
render(initialData);

// Countdown + refresh
let secondsLeft = 10;
const countdownEl = document.getElementById('countdown');

setInterval(() => {
  secondsLeft--;
  if (secondsLeft <= 0) secondsLeft = 0;
  countdownEl.textContent = secondsLeft;
}, 1000);

async function refresh() {
  try {
    const res = await fetch('/api/donations');
    if (!res.ok) return;
    const data = await res.json();
    render(data);
  } catch (e) {}
  secondsLeft = 10;
}

setInterval(refresh, REFRESH_INTERVAL);
</script>
</body>
</html>`;
}
