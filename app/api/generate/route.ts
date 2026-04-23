import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

const buildPrompt = (data: {
  service: string;
  clientType: string;
  amount: string;
  tone: string;
  details: string;
}) => `Generate a professional invoice description for the following:

Service: ${data.service}
Client Type: ${data.clientType}
Amount: ${data.amount}
Tone: ${data.tone}
Additional Details: ${data.details || "None"}

Provide:
1. A professional invoice line item description (1-2 sentences)
2. Payment terms text (2-3 sentences)
3. A short thank you note (1-2 sentences)

Format your response clearly with these 3 sections labeled.`;

async function generateWithGroq(prompt: string): Promise<string> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || "";
}

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithClaude(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, clientType, amount, tone, details } = body;

    if (!service || !clientType || !amount || !tone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = buildPrompt({ service, clientType, amount, tone, details });

    // Try providers in order: Groq → Gemini → Claude
    const providers = [
      { name: "groq", fn: () => generateWithGroq(prompt) },
      { name: "gemini", fn: () => generateWithGemini(prompt) },
      { name: "claude", fn: () => generateWithClaude(prompt) },
    ];

    let result = "";
    let usedProvider = "";
    let lastError = null;

    for (const provider of providers) {
      try {
        result = await provider.fn();
        if (result) {
          usedProvider = provider.name;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Provider ${provider.name} failed:`, err);
        continue;
      }
    }

    if (!result) {
      console.error("All providers failed:", lastError);
      return NextResponse.json(
        { error: "Failed to generate content. Please try again." },
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
