import { createPromptSeed, safeTruncate, seedByte, seedInt, type HexSeed } from "@/lib/hash";

export type BeastRarity = "Common" | "Rare" | "Epic" | "Mythic" | "Glitched";

export type BeastBody =
  | "Drake"
  | "Wraith"
  | "Golem"
  | "Serpent"
  | "Tiger"
  | "Frog"
  | "Demon"
  | "Mech";

export type BeastEyes = "Laser" | "Void" | "Ember" | "Circuit" | "Moon" | "Feral";

export type BeastHorns = "None" | "Twin" | "Crown" | "Blade" | "Halo";

export type BeastAura = "Smoke" | "Plasma" | "Runes" | "Lightning" | "Dust" | "Void";

export type BeastPalette = {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
};

export interface BeastTraits {
  seed: HexSeed;
  name: string;
  rarity: BeastRarity;
  body: BeastBody;
  eyes: BeastEyes;
  horns: BeastHorns;
  aura: BeastAura;
  palette: BeastPalette;
  powerWord: string;
  prompt: string;
}

const bodies: BeastBody[] = ["Drake", "Wraith", "Golem", "Serpent", "Tiger", "Frog", "Demon", "Mech"];
const eyes: BeastEyes[] = ["Laser", "Void", "Ember", "Circuit", "Moon", "Feral"];
const horns: BeastHorns[] = ["None", "Twin", "Crown", "Blade", "Halo"];
const auras: BeastAura[] = ["Smoke", "Plasma", "Runes", "Lightning", "Dust", "Void"];
const powerWords = [
  "Vanta",
  "Chai",
  "Nova",
  "Cyber",
  "Ember",
  "Frost",
  "Shadow",
  "Vada",
  "Astra",
  "Plasma",
  "Iron",
  "Rune"
];

const palettes: BeastPalette[] = [
  {
    background: "#070712",
    primary: "#8b5cf6",
    secondary: "#312e81",
    accent: "#b6ff5c",
    glow: "#a78bfa"
  },
  {
    background: "#090b12",
    primary: "#14b8a6",
    secondary: "#0f766e",
    accent: "#f97316",
    glow: "#5eead4"
  },
  {
    background: "#0b0712",
    primary: "#e11d48",
    secondary: "#7f1d1d",
    accent: "#facc15",
    glow: "#fb7185"
  },
  {
    background: "#050816",
    primary: "#38bdf8",
    secondary: "#1e3a8a",
    accent: "#c084fc",
    glow: "#7dd3fc"
  },
  {
    background: "#0a0a0f",
    primary: "#d946ef",
    secondary: "#581c87",
    accent: "#22c55e",
    glow: "#f0abfc"
  }
];

const promptNameMap: Array<[string, string, BeastBody?]> = [
  ["chai", "Chai"],
  ["dragon", "Dragon", "Drake"],
  ["tiger", "Tiger", "Tiger"],
  ["frog", "Frog", "Frog"],
  ["demon", "Demon", "Demon"],
  ["robot", "Robot", "Mech"],
  ["vada", "Vada"],
  ["cyber", "Cyber"],
  ["fire", "Fire"],
  ["ice", "Ice"],
  ["shadow", "Shadow"]
];

export function generateBeastTraits(prompt: string, tokenId?: number | string): BeastTraits {
  const cleanPrompt = safeTruncate(prompt, 240);
  const seed = createPromptSeed(cleanPrompt, tokenId === undefined ? "" : String(tokenId));
  const promptLower = cleanPrompt.toLowerCase();
  const bodyOverride = promptNameMap.find(([keyword]) => promptLower.includes(keyword))?.[2];
  const body = bodyOverride ?? selectFrom(bodies, seed, 1);
  const powerWord = selectPowerWord(promptLower, seed);

  return {
    seed,
    name: createBeastName(promptLower, powerWord, body),
    rarity: selectRarity(seedByte(seed, 0)),
    body,
    eyes: selectFrom(eyes, seed, 2),
    horns: selectFrom(horns, seed, 3),
    aura: selectFrom(auras, seed, 4),
    palette: palettes[seedInt(seed, 5, 2) % palettes.length],
    powerWord,
    prompt: cleanPrompt
  };
}

function selectFrom<T>(options: readonly T[], seed: string, index: number) {
  return options[seedByte(seed, index) % options.length];
}

function selectRarity(value: number): BeastRarity {
  if (value < 2) {
    return "Glitched";
  }
  if (value < 12) {
    return "Mythic";
  }
  if (value < 45) {
    return "Epic";
  }
  if (value < 105) {
    return "Rare";
  }
  return "Common";
}

function selectPowerWord(promptLower: string, seed: string) {
  const mapped = promptNameMap.find(([keyword]) => promptLower.includes(keyword))?.[1];

  return mapped ?? selectFrom(powerWords, seed, 6);
}

function createBeastName(promptLower: string, powerWord: string, body: BeastBody) {
  if (promptLower.includes("dragon")) {
    return `${powerWord} Drake`;
  }
  if (promptLower.includes("robot")) {
    return `${powerWord} Mech`;
  }

  return `${powerWord} ${body}`;
}
