import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

type InvoiceData = {
  service: string;
  clientType: string;
  amount: string;
  tone: string;
  details: string;
  docType: string;
  // Optional sender info
  yourName?: string;
  yourCompany?: string;
  yourEmail?: string;
  yourPhone?: string;
  // Optional client info
  clientName?: string;
  clientCompany?: string;
  // Optional invoice meta
  invoiceNumber?: string;
  dueDate?: string;
};

const buildPrompt = (data: InvoiceData) => {
  const isQuote = data.docType === "quote";
  const docLabel = isQuote ? "Quote / Estimate" : "Invoice";

  const senderBlock = [data.yourName, data.yourCompany, data.yourEmail, data.yourPhone]
    .filter(Boolean)
    .join(", ");
  const clientBlock = [data.clientName, data.clientCompany]
    .filter(Boolean)
    .join(", ");

  return `Generate a professional ${docLabel} text for the following:

Service: ${data.service}
Client Type: ${data.clientType}
Amount: ${data.amount}
Tone: ${data.tone}
Document Type: ${docLabel}
${senderBlock ? `From (service provider): ${senderBlock}` : ""}
${clientBlock ? `To (client): ${clientBlock}` : ""}
${data.invoiceNumber ? `${docLabel} Number: ${data.invoiceNumber}` : ""}
${data.dueDate ? `Due Date: ${data.dueDate}` : ""}
Additional Details: ${data.details || "None"}

Provide the following 3 sections, clearly labeled:

1. **${isQuote ? "Quote" : "Invoice"} Line Item Description** (1-2 sentences describing the service professionally)
2. **Payment Terms** (2-3 sentences${isQuote ? " outlining quote validity, expected timeline, and payment expectations" : " covering due date, late fees, and accepted payment methods"})
3. **${isQuote ? "Next Steps" : "Thank You Note"}** (1-2 sentences — ${isQuote ? "what happens after the client accepts the quote" : "a warm professional closing"})

${senderBlock || clientBlock ? "Use the provided names/company info naturally in the text where appropriate." : "Keep the text generic enough to fill in names manually."}`;
};

// Static system prompt — cached by Anthropic after first call (~90% cheaper on repeats)
const CLAUDE_SYSTEM_PROMPT = `You are a professional invoice and quote writer. Generate concise, professional text for business documents.

Always respond with exactly 3 clearly labeled sections:
- For invoices: **Invoice Line Item Description** (1-2 sentences), **Payment Terms** (2-3 sentences on due date, late fees, accepted payment methods), **Thank You Note** (1-2 warm closing sentences)
- For quotes: **Quote Line Item Description** (1-2 sentences), **Payment Terms** (2-3 sentences on quote validity, timeline, payment expectations), **Next Steps** (1-2 sentences on what happens after the client accepts)

Use any provided sender/client names and company info naturally in the text. If none are provided, keep text generic enough to fill in manually. Match the requested tone. Be concise.`;

const buildClaudeUserMessage = (data: InvoiceData): string => {
  const isQuote = data.docType === "quote";
  const docLabel = isQuote ? "Quote / Estimate" : "Invoice";
  const senderBlock = [data.yourName, data.yourCompany, data.yourEmail, data.yourPhone]
    .filter(Boolean)
    .join(", ");
  const clientBlock = [data.clientName, data.clientCompany]
    .filter(Boolean)
    .join(", ");

  return [
    `Generate a professional ${docLabel} for:`,
    `Service: ${data.service}`,
    `Client Type: ${data.clientType}`,
    `Amount: ${data.amount}`,
    `Tone: ${data.tone}`,
    senderBlock ? `From: ${senderBlock}` : "",
    clientBlock ? `To: ${clientBlock}` : "",
    data.invoiceNumber ? `${docLabel} Number: ${data.invoiceNumber}` : "",
    data.dueDate ? `Due Date: ${data.dueDate}` : "",
    data.details ? `Additional Details: ${data.details}` : "",
  ].filter(Boolean).join("\n");
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);

async function generateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  const client = new Groq({ apiKey });
  const completion = await withTimeout(
    client.chat.completions.create({
      model: (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim(),
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    }),
    8000
  );
  return completion.choices[0]?.message?.content || "";
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: (process.env.GEMINI_MODEL || "gemini-1.5-flash").trim(),
  });
  const result = await withTimeout(model.generateContent(prompt), 8000);
  return result.response.text();
}

async function generateWithClaude(data: InvoiceData): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: (process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001").trim(),
    max_tokens: 600,
    system: [
      {
        type: "text",
        text: CLAUDE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildClaudeUserMessage(data) }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      service, clientType, amount, tone, details,
      docType = "invoice",
      yourName, yourCompany, yourEmail, yourPhone,
      clientName, clientCompany,
      invoiceNumber, dueDate,
    } = body;

    if (!service || !clientType || !amount || !tone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const data: InvoiceData = {
      service, clientType, amount, tone, details, docType,
      yourName, yourCompany, yourEmail, yourPhone,
      clientName, clientCompany,
      invoiceNumber, dueDate,
    };

    const prompt = buildPrompt(data);

    const providers = [
      { name: "groq", fn: () => generateWithGroq(prompt) },
      { name: "gemini", fn: () => generateWithGemini(prompt) },
      { name: "claude", fn: () => generateWithClaude(data) },
    ];

    let result = "";
    let usedProvider = "";
    const errors: Record<string, string> = {};

    for (const provider of providers) {
      try {
        result = await provider.fn();
        if (result) {
          usedProvider = provider.name;
          break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors[provider.name] = msg;
        console.warn(`Provider ${provider.name} failed: ${msg}`);
        continue;
      }
    }

    if (!result) {
      console.error("All providers failed:", errors);
      return NextResponse.json(
        { error: "Failed to generate content. Please try again.", errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ result, provider: usedProvider });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
