import { NextResponse } from "next/server";
import { safeTruncate } from "@/lib/hash";
import { createTripoTextToModelTask } from "@/lib/tripo";

type ThreeDRequest = {
  prompt?: unknown;
  enhancedPrompt?: unknown;
  negativePrompt?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ThreeDRequest;
    const prompt = safeTruncate(typeof body.prompt === "string" ? body.prompt.trim() : "", 240);
    const enhancedPrompt = safeTruncate(
      typeof body.enhancedPrompt === "string" ? body.enhancedPrompt.trim() : "",
      1200
    );
    const negativePrompt = safeTruncate(
      typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "",
      600
    );
    const tripoPrompt = enhancedPrompt || prompt;
    const result = await createTripoTextToModelTask({ prompt: tripoPrompt, negativePrompt });

    return NextResponse.json({
      ...result,
      prompt: tripoPrompt
    });
  } catch (error) {
    console.error("3D generation route failed.", error);
    return NextResponse.json({
      configured: false,
      status: "fallback",
      message: "3D generation failed. Using procedural 3D fallback."
    });
  }
}
