import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  try {
    const { speech }: { speech: string } = await req.json();
    if (!speech?.trim()) return NextResponse.json({ error: "No speech provided" }, { status: 400 });

    const today = new Date().toISOString().split("T")[0];

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `You are an invoice parser. Extract invoice details from natural speech.
Return ONLY valid JSON with these exact keys (use "" for missing string fields, today's date for missing date if due date is mentioned in relative terms):
{
  "service": "what work was done",
  "clientType": "individual|small business|startup|enterprise|nonprofit|government (best guess)",
  "amount": "amount with currency symbol e.g. $500",
  "tone": "formal|friendly|concise (default formal)",
  "docType": "invoice|quote",
  "clientName": "",
  "clientCompany": "",
  "dueDate": "YYYY-MM-DD or empty",
  "details": "any extra notes"
}
Today is ${today}.`,
      messages: [{ role: "user", content: `Parse this into invoice fields: "${speech}"` }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Could not parse" }, { status: 500 });

    return NextResponse.json({ fields: JSON.parse(match[0]) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
