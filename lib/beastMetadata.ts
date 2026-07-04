import { generateBeastTraits } from "@/lib/beastTraits";
import { generateBeastImageDataUri } from "@/lib/svgBeast";

export interface BeastMetadataInput {
  prompt: string;
  tokenId?: number | string;
  chainName?: string;
  contractAddress?: string;
  owner?: string;
  name?: string;
  lore?: string;
  animationUrl?: string;
  stats?: {
    atk: number;
    def: number;
    hp: number;
    spd: number;
    level?: number;
    wins?: number;
    losses?: number;
  };
}

export type BeastMetadataAttribute = {
  trait_type: string;
  value: string | number;
};

export type BeastMetadata = {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  attributes: BeastMetadataAttribute[];
  external_url?: string;
};

export function generateBeastMetadata(input: BeastMetadataInput): BeastMetadata {
  const traits = generateBeastTraits(input.prompt, input.tokenId);
  const attributes: BeastMetadataAttribute[] = [
    { trait_type: "Rarity", value: traits.rarity },
    { trait_type: "Body", value: traits.body },
    { trait_type: "Eyes", value: traits.eyes },
    { trait_type: "Horns", value: traits.horns },
    { trait_type: "Aura", value: traits.aura },
    { trait_type: "Power Word", value: traits.powerWord }
  ];

  if (input.stats) {
    attributes.push(
      { trait_type: "ATK", value: input.stats.atk },
      { trait_type: "DEF", value: input.stats.def },
      { trait_type: "HP", value: input.stats.hp },
      { trait_type: "SPD", value: input.stats.spd },
      { trait_type: "Level", value: input.stats.level ?? 1 },
      { trait_type: "Wins", value: input.stats.wins ?? 0 },
      { trait_type: "Losses", value: input.stats.losses ?? 0 }
    );
  }

  if (input.chainName) {
    attributes.push({ trait_type: "Chain", value: input.chainName });
  }
  if (input.contractAddress) {
    attributes.push({ trait_type: "Contract", value: input.contractAddress });
  }
  if (input.owner) {
    attributes.push({ trait_type: "Owner", value: input.owner });
  }

  return {
    name: input.name ?? (input.tokenId ? `${traits.name} #${input.tokenId}` : traits.name),
    description:
      input.lore ??
      "A deterministic MonBeast Arena creature generated from a prompt. Visual traits are metadata only; official stats and battle outcomes live on-chain.",
    image: generateBeastImageDataUri(input.prompt, input.tokenId),
    ...(input.animationUrl ? { animation_url: input.animationUrl } : {}),
    attributes
  };
}

export function metadataToDataUri(metadata: object): string {
  return `data:application/json;base64,${base64Encode(JSON.stringify(metadata))}`;
}

export function generateBeastTokenURI(input: BeastMetadataInput): string {
  // MonBeastArena.sol stores this in imageURI, but the value is an NFT metadata data URI for MVP.
  return metadataToDataUri(generateBeastMetadata(input));
}

export function extractImageFromTokenURI(tokenURI?: string) {
  if (!tokenURI) {
    return undefined;
  }
  if (tokenURI.startsWith("data:image/")) {
    return tokenURI;
  }
  if (!tokenURI.startsWith("data:application/json;base64,")) {
    return undefined;
  }

  try {
    const encoded = tokenURI.slice("data:application/json;base64,".length);
    const json = JSON.parse(base64Decode(encoded)) as { image?: unknown };
    return typeof json.image === "string" ? json.image : undefined;
  } catch {
    return undefined;
  }
}

function base64Encode(value: string) {
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  return Buffer.from(value, "utf8").toString("base64");
}

function base64Decode(value: string) {
  if (typeof atob === "function") {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(value, "base64").toString("utf8");
}
