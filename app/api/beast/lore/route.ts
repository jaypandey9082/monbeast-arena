import { NextResponse } from "next/server";
import { enhancePromptWithClaude } from "@/lib/claudeBeastPrompt";
import { safeTruncate } from "@/lib/hash";

type LoreRequest = {
  prompt?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoreRequest;
    const prompt = safeTruncate(typeof body.prompt === "string" ? body.prompt.trim() : "", 240);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    return NextResponse.json(await enhancePromptWithClaude({ rawPrompt: prompt }));
  } catch (error) {
    console.error("Lore enhancement route failed.", error);
    return NextResponse.json(
      { error: "Could not read lore enhancement request." },
      { status: 400 }
    );
  }
}
