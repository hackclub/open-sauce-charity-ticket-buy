import type { AirtableTransaction } from "./airtable";

let transactions: AirtableTransaction[] = [];
let knownHcbIds = new Set<string>();
let _lock: Promise<void> | null = null;
let _leaderboardPng: Buffer | null = null;

export function getTransactions(): AirtableTransaction[] {
  return transactions;
}

export function getDonations(): AirtableTransaction[] {
  return transactions.filter((t) => t.isDonation);
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface MergedDonor {
  name: string;
  amount: number;
  latestDate: string;
  latestAmount: number;
  count: number;
}

/** Merge donations by normalized name, summing amounts and keeping the latest date. */
export function mergeDonations(donations: AirtableTransaction[]): MergedDonor[] {
  const map = new Map<string, MergedDonor>();
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
      map.set(key, { name: d.name, amount: d.amount, latestDate: d.date, latestAmount: d.amount, count: 1 });
    }
  }
  return Array.from(map.values());
}

export function getLeaderboardPng(): Buffer | null {
  return _leaderboardPng;
}

export function setLeaderboardPng(png: Buffer) {
  _leaderboardPng = png;
}

export function isHcbIdKnown(id: string): boolean {
  return knownHcbIds.has(id);
}

export function addKnownHcbId(id: string) {
  knownHcbIds.add(id);
}

export function replaceTransactions(newTransactions: AirtableTransaction[]) {
  transactions = newTransactions;
  const idsFromAirtable = new Set(
    newTransactions
      .map((t) => t.hcbId)
      .filter((id): id is string => id !== null && id !== "")
  );
  for (const id of idsFromAirtable) {
    knownHcbIds.add(id);
  }
}

// Simple async mutex to prevent races between HCB->Airtable writes and Airtable->RAM syncs
export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  while (_lock) await _lock;
  let resolve: () => void;
  _lock = new Promise<void>((r) => (resolve = r));
  try {
    return await fn();
  } finally {
    _lock = null;
    resolve!();
  }
}
