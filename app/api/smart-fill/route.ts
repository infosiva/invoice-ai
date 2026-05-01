import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; InvoiceMint/1.0)",
      "Accept": "text/html,application/xhtml+xml,text/plain",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // Strip tags and collapse whitespace — keep enough for AI to extract contact info
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 4000); // cap at 4k chars per URL
  return text;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  try {
    const { urls }: { urls: string[] } = await req.json();
    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    // Fetch all URLs in parallel, silently skip failures
    const pages = await Promise.all(
      urls.slice(0, 3).map(async (url) => {
        try {
          const text = await fetchPageText(url);
          return { url, text };
        } catch {
          return { url, text: "" };
        }
      })
    );

    const combined = pages
      .filter((p) => p.text)
      .map((p) => `--- From ${p.url} ---\n${p.text}`)
      .join("\n\n");

    if (!combined) {
      return NextResponse.json({ error: "Could not read any of the provided URLs" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `You are a contact information extractor. Extract professional contact details from web page content.
Return ONLY valid JSON with these exact keys (use empty string "" if not found):
{
  "name": "Full name of the person/professional",
  "company": "Company or business name",
  "email": "Email address",
  "phone": "Phone number",
  "footerNote": "Any ABN, bank details, or payment info found (max 100 chars)"
}
Do not include any other text, just the JSON object.`,
      messages: [
        {
          role: "user",
          content: `Extract contact/professional information from this web content:\n\n${combined}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });

    const extracted = JSON.parse(match[0]);
    return NextResponse.json({ extracted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Smart fill error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
