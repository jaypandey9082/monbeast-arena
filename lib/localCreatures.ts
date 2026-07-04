import { generateBeastTraits, type BeastRarity } from "@/lib/beastTraits";
import { createPromptSeed, seedByte, seedInt } from "@/lib/hash";
import { build3DBeastTokenUri, decodeTokenUri } from "@/lib/tokenMetadata";

export const LOCAL_CREATURES_KEY = "monbeast:my-creatures";
export const TRIPO_HISTORY_KEY = "monbeast:tripo-model-history";
export const LOCAL_CREATURES_EVENT = "monbeast:creatures-updated";

export type LocalCreatureSource = "tripo" | "fallback" | "minted" | "history";
export type LocalCreatureStatus =
  | "queued"
  | "generating"
  | "waiting"
  | "complete"
  | "failed"
  | "fallback";

export type LocalCreatureStats = {
  atk: number;
  def: number;
  hp: number;
  spd: number;
  level: number;
  wins: number;
  losses: number;
};

export type LocalCreature = {
  id: string;
  prompt: string;
  name: string;
  rarity: BeastRarity;
  modelUrl?: string;
  renderedImageUrl?: string;
  tokenURI: string;
  taskId?: string;
  source: LocalCreatureSource;
  status?: LocalCreatureStatus;
  progress?: number;
  message?: string;
  enhancedPrompt?: string;
  createdAt: number;
  updatedAt: number;
  mintedTokenId?: string;
  stats: LocalCreatureStats;
};

type CreatureInput = {
  id?: string;
  prompt: string;
  name?: string;
  rarity?: BeastRarity;
  modelUrl?: string;
  renderedImageUrl?: string;
  tokenURI?: string;
  taskId?: string;
  source: LocalCreatureSource;
  status?: LocalCreatureStatus;
  progress?: number;
  message?: string;
  enhancedPrompt?: string;
  createdAt?: number;
  updatedAt?: number;
  mintedTokenId?: string;
};

type TripoHistoryItem = {
  taskId?: string;
  prompt?: string;
  status?: string;
  modelUrl?: string;
  previewUrl?: string;
  renderedImageUrl?: string;
  progress?: number;
  message?: string;
  enhancedPrompt?: string;
  createdAt?: number;
  updatedAt?: number;
};

export function makeLocalCreature(input: CreatureInput): LocalCreature {
  const prompt = input.prompt.trim();
  const id = input.id || input.taskId || createLocalCreatureId(prompt, input.modelUrl);
  const traits = generateBeastTraits(prompt, id);
  const tokenURI =
    input.tokenURI ||
    build3DBeastTokenUri({
      prompt,
      tokenId: input.mintedTokenId || id,
      modelUrl: input.modelUrl,
      renderedImageUrl: input.renderedImageUrl
    });
  const metadata = decodeTokenUri(tokenURI);
  const metadataModelUrl =
    typeof metadata?.animation_url === "string" ? metadata.animation_url : undefined;
  const metadataImageUrl =
    typeof metadata?.image === "string" &&
    (metadata.image.startsWith("http") || metadata.image.startsWith("data:image/"))
      ? metadata.image
      : undefined;
  const rarityAttribute = metadata?.attributes?.find(
    (attribute) => attribute.trait_type === "Rarity" && typeof attribute.value === "string"
  )?.value;

  return {
    id,
    prompt,
    name: input.name || metadata?.name || traits.name,
    rarity: input.rarity || (rarityAttribute as BeastRarity | undefined) || traits.rarity,
    modelUrl: input.modelUrl || metadataModelUrl,
    renderedImageUrl: input.renderedImageUrl || (input.source === "fallback" ? undefined : metadataImageUrl),
    tokenURI,
    taskId: input.taskId,
    source: input.source,
    status: input.status,
    progress: input.progress,
    message: input.message,
    enhancedPrompt: input.enhancedPrompt,
    createdAt: input.createdAt || Date.now(),
    updatedAt: input.updatedAt || Date.now(),
    mintedTokenId: input.mintedTokenId,
    stats: previewStats(prompt, id)
  };
}

export function createSeriousBeastPosterDataUri({
  prompt,
  id = createLocalCreatureId(prompt),
  name
}: {
  prompt: string;
  id?: string;
  name?: string;
}) {
  const traits = generateBeastTraits(prompt, id);
  return characterPosterDataUri({
    id,
    name: name || traits.name,
    bodyColor: traits.palette.primary,
    armorColor: traits.palette.secondary,
    accentColor: traits.palette.accent,
    glowColor: traits.palette.glow,
    hornColor: traits.palette.accent
  });
}

export function readLocalCreatures(): LocalCreature[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved = parseLocalCreatures(window.localStorage.getItem(LOCAL_CREATURES_KEY));
  const history = parseTripoHistory(window.localStorage.getItem(TRIPO_HISTORY_KEY));
  const merged = removeWeakProceduralCards(mergeCreatures([...saved, ...history]));

  if (
    merged.length !== saved.length ||
    history.length > 0 ||
    hasWeakProceduralCards(saved)
  ) {
    writeCreatures(merged);
  }

  return merged;
}

export function upsertLocalCreature(creature: LocalCreature) {
  if (typeof window === "undefined") {
    return;
  }

  const merged = mergeCreatures([creature, ...readLocalCreatures()]);
  writeCreatures(merged);
  window.dispatchEvent(new Event(LOCAL_CREATURES_EVENT));
}

export function updateLocalCreatureMint(params: {
  prompt: string;
  modelUrl?: string;
  tokenURI?: string;
  mintedTokenId: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = readLocalCreatures();
  const index = existing.findIndex((creature) =>
    params.modelUrl
      ? creature.modelUrl === params.modelUrl
      : creature.prompt.trim().toLowerCase() === params.prompt.trim().toLowerCase()
  );

  const next =
    index >= 0
      ? existing.map((creature, creatureIndex) =>
          creatureIndex === index
            ? {
                ...creature,
                mintedTokenId: params.mintedTokenId,
                source: "minted" as const,
                tokenURI: params.tokenURI || creature.tokenURI
              }
            : creature
        )
      : [
          makeLocalCreature({
            prompt: params.prompt,
            modelUrl: params.modelUrl,
            tokenURI: params.tokenURI,
            mintedTokenId: params.mintedTokenId,
            source: "minted"
          }),
          ...existing
        ];

  writeCreatures(mergeCreatures(next));
  window.dispatchEvent(new Event(LOCAL_CREATURES_EVENT));
}

function parseLocalCreatures(raw: string | null) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeLocalCreature(item))
      .filter((creature): creature is LocalCreature => Boolean(creature));
  } catch {
    return [];
  }
}

function parseTripoHistory(raw: string | null) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        const value = item as TripoHistoryItem;
        if (!value.prompt) {
          return undefined;
        }

        return makeLocalCreature({
          prompt: value.prompt,
          modelUrl: value.modelUrl,
          renderedImageUrl: value.renderedImageUrl || value.previewUrl,
          progress: value.progress,
          message: value.message,
          enhancedPrompt: value.enhancedPrompt,
          taskId: value.taskId,
          source: value.modelUrl ? "history" : "tripo",
          status: normalizeStatus(value.status) || (value.modelUrl ? "complete" : "waiting"),
          createdAt: value.createdAt || value.updatedAt
        });
      })
      .filter((creature): creature is LocalCreature => Boolean(creature));
  } catch {
    return [];
  }
}

function normalizeLocalCreature(item: unknown): LocalCreature | undefined {
  const value = item as Partial<LocalCreature>;
  if (!value || typeof value.prompt !== "string" || !value.prompt.trim()) {
    return undefined;
  }

  return makeLocalCreature({
    id: typeof value.id === "string" ? value.id : undefined,
    prompt: value.prompt,
    name: typeof value.name === "string" ? value.name : undefined,
    rarity: isBeastRarity(value.rarity) ? value.rarity : undefined,
    modelUrl: typeof value.modelUrl === "string" ? value.modelUrl : undefined,
    renderedImageUrl: typeof value.renderedImageUrl === "string" ? value.renderedImageUrl : undefined,
    tokenURI: typeof value.tokenURI === "string" ? value.tokenURI : undefined,
    taskId: typeof value.taskId === "string" ? value.taskId : undefined,
    source: value.source || "fallback",
    status: normalizeStatus(value.status),
    progress: typeof value.progress === "number" ? value.progress : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
    enhancedPrompt: typeof value.enhancedPrompt === "string" ? value.enhancedPrompt : undefined,
    createdAt: typeof value.createdAt === "number" ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : undefined,
    mintedTokenId: typeof value.mintedTokenId === "string" ? value.mintedTokenId : undefined
  });
}

function writeCreatures(creatures: LocalCreature[]) {
  window.localStorage.setItem(LOCAL_CREATURES_KEY, JSON.stringify(creatures.slice(0, 48)));
}

function mergeCreatures(creatures: LocalCreature[]) {
  const byKey = new Map<string, LocalCreature>();

  for (const creature of creatures) {
    const key = creature.taskId || creature.modelUrl || creature.id || creature.prompt.toLowerCase();
    const existing = byKey.get(key);
    if (!existing || creature.updatedAt >= existing.updatedAt || creature.source === "minted") {
      byKey.set(key, creature);
    }
  }

  return [...byKey.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function removeWeakProceduralCards(creatures: LocalCreature[]) {
  return creatures.filter((creature) => !isWeakProceduralCard(creature));
}

function hasWeakProceduralCards(creatures: LocalCreature[]) {
  return creatures.some(isWeakProceduralCard);
}

function isWeakProceduralCard(creature: LocalCreature) {
  return (
    isPremiumStarterId(creature.id) ||
    (!creature.modelUrl &&
      !creature.taskId &&
      creature.source === "history")
  );
}

const PREMIUM_STARTER_IDS = ["NEON-DRAKE", "VADA-TITAN", "DIAMOND-FROG"];

function isPremiumStarterId(id: string) {
  return PREMIUM_STARTER_IDS.includes(id);
}

function characterPosterDataUri({
  id,
  name,
  bodyColor,
  armorColor,
  accentColor,
  glowColor,
  hornColor
}: {
  id: string;
  name: string;
  bodyColor: string;
  armorColor: string;
  accentColor: string;
  glowColor: string;
  hornColor: string;
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <defs>
    <radialGradient id="bg" cx="50%" cy="32%" r="72%">
      <stop offset="0" stop-color="${glowColor}" stop-opacity=".22"/>
      <stop offset=".42" stop-color="#161225"/>
      <stop offset="1" stop-color="#05040a"/>
    </radialGradient>
    <linearGradient id="body" x1="18%" x2="82%" y1="5%" y2="100%">
      <stop offset="0" stop-color="${glowColor}"/>
      <stop offset=".34" stop-color="${bodyColor}"/>
      <stop offset=".72" stop-color="${armorColor}"/>
      <stop offset="1" stop-color="#05040a"/>
    </linearGradient>
    <linearGradient id="blade" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".35" stop-color="${glowColor}"/>
      <stop offset="1" stop-color="${accentColor}"/>
    </linearGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#000000" flood-opacity=".55"/>
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="${glowColor}" flood-opacity=".42"/>
    </filter>
  </defs>
  <rect width="900" height="700" fill="url(#bg)"/>
  <g opacity=".62">
    <circle cx="126" cy="86" r="3" fill="#fbbf24"/>
    <circle cx="764" cy="104" r="3" fill="#fbbf24"/>
    <circle cx="824" cy="468" r="2" fill="${glowColor}"/>
    <circle cx="207" cy="548" r="2" fill="#a78bfa"/>
    <circle cx="645" cy="72" r="2" fill="#ffffff"/>
    <circle cx="314" cy="132" r="2" fill="${accentColor}"/>
    <circle cx="582" cy="580" r="3" fill="${glowColor}"/>
  </g>
  <ellipse cx="462" cy="610" rx="235" ry="48" fill="#000" opacity=".36"/>
  <g filter="url(#shadow)">
    <path d="M350 174 L286 54 L422 132 Z" fill="url(#blade)"/>
    <path d="M556 166 L644 42 L612 190 Z" fill="url(#blade)"/>
    <path d="M406 142 L450 62 L496 142 Z" fill="${hornColor}"/>
    <path d="M281 286 L120 226 L224 386 Z" fill="${accentColor}" opacity=".92"/>
    <path d="M637 296 L806 222 L697 404 Z" fill="${accentColor}" opacity=".92"/>
    <path d="M328 452 L198 498 L268 548 L378 498 Z" fill="${armorColor}"/>
    <path d="M590 452 L724 500 L648 552 L538 498 Z" fill="${armorColor}"/>
    <path d="M382 512 L328 650 L410 650 L452 524 Z" fill="${armorColor}"/>
    <path d="M530 520 L584 650 L666 650 L610 510 Z" fill="${armorColor}"/>
    <path d="M450 134 C556 138 634 214 646 332 C661 474 584 578 462 590 C336 602 250 514 252 376 C254 246 334 132 450 134 Z" fill="url(#body)"/>
    <path d="M316 256 C370 210 538 210 604 262" fill="none" stroke="${glowColor}" stroke-width="18" stroke-linecap="round" opacity=".38"/>
    <path d="M334 342 L410 314 L396 356 L330 370 Z" fill="${glowColor}"/>
    <path d="M508 314 L594 342 L590 372 L518 356 Z" fill="${glowColor}"/>
    <path d="M422 430 L460 452 L510 430 L492 494 L448 494 Z" fill="#05040a" opacity=".64"/>
    <path d="M340 410 L296 438 L328 454 M584 414 L630 442 L596 458" fill="none" stroke="${accentColor}" stroke-width="10" stroke-linecap="round"/>
    <path d="M266 498 L196 590 M652 502 L732 592" fill="none" stroke="url(#blade)" stroke-width="16" stroke-linecap="round"/>
    <path d="M400 588 L360 652 M532 590 L578 652" fill="none" stroke="${glowColor}" stroke-width="11" stroke-linecap="round" opacity=".76"/>
  </g>
  <g opacity=".72">
    <ellipse cx="456" cy="362" rx="310" ry="60" fill="none" stroke="${accentColor}" stroke-width="6" transform="rotate(-8 456 362)"/>
    <ellipse cx="456" cy="362" rx="330" ry="78" fill="none" stroke="${glowColor}" stroke-width="3" opacity=".28" transform="rotate(-27 456 362)"/>
  </g>
  <rect x="54" y="572" width="792" height="92" rx="24" fill="#07050d" opacity=".74" stroke="${accentColor}" stroke-opacity=".35"/>
  <text x="90" y="624" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="900">${escapeSvgText(name)}</text>
  <text x="90" y="650" fill="${glowColor}" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="900" letter-spacing="6">${escapeSvgText(id)} · 3D CONCEPT</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeStatus(value: unknown): LocalCreatureStatus | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const status = value.toLowerCase();
  if (status === "submitted" || status === "pending" || status === "running") {
    return "generating";
  }
  if (status === "success" || status === "completed") {
    return "complete";
  }
  if (
    status === "queued" ||
    status === "generating" ||
    status === "waiting" ||
    status === "complete" ||
    status === "failed" ||
    status === "fallback"
  ) {
    return status;
  }

  return undefined;
}

function isBeastRarity(value: unknown): value is BeastRarity {
  return (
    value === "Common" ||
    value === "Rare" ||
    value === "Epic" ||
    value === "Legendary"
  );
}

function createLocalCreatureId(prompt: string, modelUrl?: string) {
  return createPromptSeed(prompt, modelUrl || Date.now().toString()).slice(2, 10).toUpperCase();
}

function previewStats(prompt: string, id: string): LocalCreatureStats {
  const seed = createPromptSeed(prompt, id);
  const remaining = 80;
  const atkExtra = seedInt(seed, 1, 2) % 28;
  const defExtra = seedInt(seed, 3, 2) % 24;
  const hpExtra = seedInt(seed, 5, 2) % 24;
  const used = Math.min(atkExtra + defExtra + hpExtra, remaining);
  const spdExtra = remaining - used;

  return {
    atk: 5 + atkExtra,
    def: 5 + defExtra,
    hp: 5 + hpExtra,
    spd: 5 + spdExtra,
    level: 1 + (seedByte(seed, 8) % 3),
    wins: 0,
    losses: 0
  };
}
