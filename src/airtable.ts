const PAT = process.env.AIRTABLE_PAT!;
const BASE_ID = "appCXoE6LGvB5iBNY";
const TABLE_ID = "tblo0lUjHB8GzQvlM";
const API = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

const headers = {
  Authorization: `Bearer ${PAT}`,
  "Content-Type": "application/json",
};

export interface AirtableTransaction {
  airtableId: string;
  name: string;
  amount: number;
  date: string;
  hcbId: string | null;
  rawName: string | null;
  memo: string | null;
  isDonation: boolean;
  transactionType: string | null;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

function recordToTransaction(rec: AirtableRecord): AirtableTransaction {
  return {
    airtableId: rec.id,
    name: (rec.fields["Name"] as string) || "",
    amount: (rec.fields["Amount"] as number) || 0,
    date: (rec.fields["First Seen"] as string) || "",
    hcbId: (rec.fields["HCB Donation ID"] as string) || null,
    rawName: (rec.fields["Raw Donor Name"] as string) || null,
    memo: (rec.fields["Memo"] as string) || null,
    isDonation: (rec.fields["Show Publicly As Donation"] as boolean) || false,
    transactionType: (rec.fields["HCB Raw Transaction Type"] as string) || null,
  };
}

export async function fetchAllRecords(): Promise<AirtableTransaction[]> {
  const all: AirtableTransaction[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(API);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error(`Airtable fetch error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    for (const rec of data.records) {
      all.push(recordToTransaction(rec));
    }
    offset = data.offset;
  } while (offset);
  return all;
}

export async function createRecord(fields: {
  Name: string;
  Amount: number;
  "First Seen": string;
  "HCB Donation ID": string;
  "Raw Donor Name": string;
  Memo: string;
  "Show Publicly As Donation": boolean;
  "HCB Raw Transaction Type": string;
  "HCB Ledger Date": string;
}): Promise<AirtableTransaction> {
  const res = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Airtable create error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return recordToTransaction(data);
}
