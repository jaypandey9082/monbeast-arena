import { NextResponse } from "next/server";
import { enhancePromptWithClaude } from "@/lib/claudeBeastPrompt";
import { safeTruncate } from "@/lib/hash";
import { createTripoTextToModelTask } from "@/lib/tripo";

type Generate3DRequest = {
  prompt?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Generate3DRequest;
    const rawPrompt = safeTruncate(typeof body.prompt === "string" ? body.prompt.trim() : "", 240);

    if (!rawPrompt) {
      return NextResponse.json({ ok: false, error: "Prompt is required." }, { status: 400 });
    }

    const enhancement = await enhancePromptWithClaude({ rawPrompt });
    const tripo = await createTripoTextToModelTask({
      prompt: enhancement.tripoPrompt,
      negativePrompt: enhancement.negativePrompt
    });
    const taskId = tripo.taskId || tripo.task_id;
    const tripoReady = tripo.status === "complete" && Boolean(tripo.modelUrl);

    return NextResponse.json({
      ok: true,
      stage: !tripo.configured ? "fallback" : tripoReady ? "complete" : taskId ? "queued" : tripo.status,
      name: enhancement.name,
      lore: enhancement.lore,
      battleCry: enhancement.battleCry,
      victoryLine: enhancement.victoryLine,
      rawPrompt,
      tripoPrompt: enhancement.tripoPrompt,
      negativePrompt: enhancement.negativePrompt,
      traits: enhancement.traits,
      taskId,
      task_id: taskId,
      status: tripo.status,
      progress: tripo.progress,
      modelUrl: tripo.modelUrl,
      renderedImageUrl: tripo.renderedImageUrl || tripo.previewUrl,
      message: tripo.message,
      configured: {
        claude: enhancement.configured,
        tripo: tripo.configured
      },
      providers: {
        claude: enhancement.provider,
        tripo: tripo.provider || "tripo"
      }
    });
  } catch (error) {
    console.error("Unified 3D generation route failed.", error);
    return NextResponse.json(
      {
        ok: false,
        stage: "failed",
        message: "Generation request failed. Retry or use the local 3D fallback."
      },
      { status: 500 }
    );
  }
}
