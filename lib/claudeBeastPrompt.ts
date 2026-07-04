import "server-only";

import { generateBeastTraits, type BeastRarity } from "@/lib/beastTraits";
import { safeTruncate } from "@/lib/hash";

export type ClaudeBeastPromptInput = {
  rawPrompt: string;
};

export type ClaudeBeastPromptResult = {
  configured: boolean;
  provider: "claude" | "fallback";
  name: string;
  lore: string;
  battleCry: string;
  victoryLine: string;
  tripoPrompt: string;
  negativePrompt: string;
  traits: {
    archetype: string;
    bodyType: string;
    material: string;
    colors: string[];
    weaponsOrFeatures: string[];
    aura: string;
    rarity: string;
  };
};

const CLAUDE_SYSTEM_PROMPT = `You are generating a text-to-3D prompt for a premium Web3 monster battle game called MonBeast Arena. The output will be sent to Tripo text-to-3D. Convert the user's short idea into a detailed, game-ready 3D creature prompt. The result must be a full-body stylized battle creature, not a flat logo, not a cartoon face, not a human portrait, not a simple emoji mascot. Include anatomy, silhouette, armor/materials, pose, colors, and game-ready style. Return JSON only.

Avoid: random smiley face, simple round mascot, flat 2D card, human face, human portrait, text in model, logo, UI, weapon-only object, plain sphere, cute emoji, low-effort toy, generic cartoon head.

JSON shape:
{
  "name": "short original beast name",
  "lore": "one short sentence",
  "battleCry": "short battle cry",
  "victoryLine": "short victory line",
  "tripoPrompt": "detailed full-body text-to-3D creature prompt",
  "negativePrompt": "comma-separated negatives",
  "traits": {
    "archetype": "string",
    "bodyType": "string",
    "material": "string",
    "colors": ["string"],
    "weaponsOrFeatures": ["string"],
    "aura": "string",
    "rarity": "Common | Rare | Epic | Legendary"
  }
}`;

const DEFAULT_NEGATIVE_PROMPT =
  "flat 2D image, smiley face, simple sphere, emoji, logo, text, UI, human portrait, human face, cute toy, low detail, blurry, plain round head, random mascot face, weapon-only object";

export async function enhancePromptWithClaude({
  rawPrompt
}: ClaudeBeastPromptInput): Promise<ClaudeBeastPromptResult> {
  const prompt = safeTruncate(rawPrompt.trim(), 240);
  const fallback = buildFallbackEnhancement(prompt);

  if (!prompt || !process.env.ANTHROPIC_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 900,
        temperature: 0.8,
        system: CLAUDE_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify({ prompt })
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = data.content?.find((part) => part.type === "text")?.text ?? "";
    return normalizeClaudeJson(text, fallback);
  } catch (error) {
    console.error("Claude beast prompt failed; using deterministic fallback.", error);
    return { ...fallback, configured: true };
  }
}

export function buildFallbackEnhancement(rawPrompt: string): ClaudeBeastPromptResult {
  const prompt = safeTruncate(rawPrompt.trim() || "arena beast", 240);
  const traits = generateBeastTraits(prompt);
  const name = traits.name;
  const rarity = normalizeRarity(traits.rarity);
  const colors = [traits.palette.primary, traits.palette.secondary, traits.palette.accent];

  return {
    configured: false,
    provider: "fallback",
    name,
    lore: `${name} was forged from "${prompt}" and enters the arena with ${traits.aura.toLowerCase()} pressure.`,
    battleCry: `${traits.powerWord}! Winner takes all.`,
    victoryLine: "Your beast is mine now.",
    tripoPrompt:
      `A full-body stylized 3D battle creature called ${name}, inspired by ${prompt}. ` +
      `It has a ${traits.body.toLowerCase()} monster body, ${traits.eyes.toLowerCase()} eyes, ${traits.horns.toLowerCase()} horn silhouette, layered armor plates, clawed limbs, expressive combat stance, ${traits.aura.toLowerCase()} aura, high-quality game asset, detailed geometry, PBR materials, centered full body, dark sci-fi fantasy arena style, no base, no text.`,
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    traits: {
      archetype: "Arena beast",
      bodyType: traits.body,
      material: "layered armor plates and glowing organic shell",
      colors,
      weaponsOrFeatures: [traits.horns, "clawed limbs", "arena armor"],
      aura: traits.aura,
      rarity
    }
  };
}

function normalizeClaudeJson(text: string, fallback: ClaudeBeastPromptResult): ClaudeBeastPromptResult {
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as Partial<ClaudeBeastPromptResult>;
  const parsedTraits = (parsed.traits ?? {}) as Partial<ClaudeBeastPromptResult["traits"]>;

  return {
    configured: true,
    provider: "claude",
    name: safeText(parsed.name, fallback.name, 80),
    lore: safeText(parsed.lore, fallback.lore, 240),
    battleCry: safeText(parsed.battleCry, fallback.battleCry, 100),
    victoryLine: safeText(parsed.victoryLine, fallback.victoryLine, 100),
    tripoPrompt: enforce3DPrompt(safeText(parsed.tripoPrompt, fallback.tripoPrompt, 1200)),
    negativePrompt: safeText(parsed.negativePrompt, DEFAULT_NEGATIVE_PROMPT, 500),
    traits: {
      archetype: safeText(parsedTraits.archetype, fallback.traits.archetype, 80),
      bodyType: safeText(parsedTraits.bodyType, fallback.traits.bodyType, 80),
      material: safeText(parsedTraits.material, fallback.traits.material, 120),
      colors: safeStringArray(parsedTraits.colors, fallback.traits.colors),
      weaponsOrFeatures: safeStringArray(
        parsedTraits.weaponsOrFeatures,
        fallback.traits.weaponsOrFeatures
      ),
      aura: safeText(parsedTraits.aura, fallback.traits.aura, 80),
      rarity: normalizeRarity(parsedTraits.rarity)
    }
  };
}

function enforce3DPrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  const required =
    lower.includes("full-body") || lower.includes("full body")
      ? ""
      : "Full-body stylized 3D battle creature, ";

  return `${required}${prompt}. Game-ready model, detailed geometry, PBR materials, centered creature, no text, no logo, not a flat 2D image.`;
}

function safeText(value: unknown, fallback: string, max: number) {
  return typeof value === "string" && value.trim() ? safeTruncate(value.trim(), max) : fallback;
}

function safeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const clean = value
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => safeTruncate(item, 60))
    .slice(0, 5);

  return clean.length ? clean : fallback;
}

function normalizeRarity(value: unknown): BeastRarity {
  if (value === "Legendary") {
    return "Mythic";
  }

  if (value === "Rare" || value === "Epic" || value === "Mythic" || value === "Glitched") {
    return value;
  }

  return "Common";
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 18_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
