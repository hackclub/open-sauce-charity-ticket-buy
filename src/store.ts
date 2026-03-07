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
