import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function classifyTransaction(opts: {
  memo: string;
  type: string;
  amountCents: number;
  donorName?: string;
}): Promise<{ isDonation: boolean; displayName: string }> {
  const { text } = await generateText({
    model: openai("gpt-5.4"),
    system: `You analyze financial transactions for a charity donation tracker (Open Sauce Charity Ticket Buy on HCB / Hack Club Bank).

For each transaction, determine:
1. isDonation: Is this a donation/contribution to the charity? Consider:
   - Positive amounts from donors, sponsors, DAFs, checks, ACH deposits = donations
   - Card charges (expenses), HCB fees, outgoing transfers = NOT donations
   - Internal transfers between HCB orgs MAY be donations depending on context
   - Fiscal sponsorship fees are NOT donations
2. displayName: A clean display name for the leaderboard:
   - If there's a donor name, clean it up (proper capitalization, trim whitespace)
   - Remove any profanity, slurs, or offensive content — use "Anonymous Donor" instead
   - If the name is a joke/troll but not offensive, keep it
   - If it's a company/org, keep proper casing
   - If anonymous or no clear donor name, use "Anonymous Donor"
   - For non-donations, still provide a reasonable name from the memo

Respond with ONLY a JSON object like: {"isDonation": true, "displayName": "John Smith"}`,
    prompt: `Transaction type: ${opts.type}
Amount: ${opts.amountCents} cents
Memo: "${opts.memo}"
Donor name: "${opts.donorName || "N/A"}"`,
    maxTokens: 200,
  });

  const json = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(json);
  return {
    isDonation: Boolean(parsed.isDonation),
    displayName: String(parsed.displayName || "Anonymous Donor"),
  };
}
