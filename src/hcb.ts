const ORG_SLUG = "open-sauce-charity-ticket-buy";
const BASE = "https://hcb.hackclub.com/api/v3";

export interface HcbTransaction {
  id: string;
  amount_cents: number;
  memo: string;
  date: string;
  type: string;
  pending: boolean;
  // Present when type is "donation" and expand=donation is used
  donation?: {
    id: string;
    donor: {
      name: string;
      anonymous: boolean;
    };
  };
}

export interface HcbDonation {
  id: string;
  memo: string;
  amount_cents: number;
  donor: {
    name: string;
    anonymous: boolean;
  };
  date: string;
  transaction: {
    id: string;
  };
}

async function fetchPaginated<T>(url: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}page=${page}&per_page=100`);
    if (!res.ok) throw new Error(`HCB API error: ${res.status}`);
    const data: T[] = await res.json();
    all.push(...data);
    const totalPages = parseInt(res.headers.get("x-total-pages") || "1");
    if (page >= totalPages) break;
    page++;
  }
  return all;
}

export async function fetchTransactions(): Promise<HcbTransaction[]> {
  return fetchPaginated<HcbTransaction>(
    `${BASE}/organizations/${ORG_SLUG}/transactions`
  );
}

export async function fetchDonations(): Promise<HcbDonation[]> {
  return fetchPaginated<HcbDonation>(
    `${BASE}/organizations/${ORG_SLUG}/donations`
  );
}
