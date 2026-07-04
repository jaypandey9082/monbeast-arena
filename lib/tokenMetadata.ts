import { generateBeastTraits } from "@/lib/beastTraits";
import { generateBeastImageDataUri } from "@/lib/svgBeast";

export type TokenAttribute = {
  trait_type: string;
  value: string | number;
};

export type DecodedTokenMetadata = {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: TokenAttribute[];
  [key: string]: unknown;
};

export type Build3DBeastTokenUriInput = {
  prompt: string;
  tokenId?: number | string;
  chainName?: string;
  contractAddress?: string;
  owner?: string;
  name?: string;
  lore?: string;
  modelUrl?: string;
  animationUrl?: string;
  renderedImageUrl?: string;
  traits?: TokenAttribute[];
  stats?: {
    atk: number;
    def: number;
    hp: number;
    spd: number;
    level?: number;
    wins?: number;
    losses?: number;
  };
};

const JSON_DATA_URI_PREFIX = "data:application/json;base64,";

export function decodeTokenUri(tokenUri?: string): DecodedTokenMetadata | undefined {
  if (!tokenUri || !tokenUri.startsWith(JSON_DATA_URI_PREFIX)) {
    return undefined;
  }

  try {
    const encoded = tokenUri.slice(JSON_DATA_URI_PREFIX.length);
    const decoded = JSON.parse(base64Decode(encoded)) as DecodedTokenMetadata;
    return decoded && typeof decoded === "object" ? decoded : undefined;
  } catch {
    return undefined;
  }
}

export function getAnimationUrlFromTokenUri(tokenUri?: string) {
  const metadata = decodeTokenUri(tokenUri);
  return typeof metadata?.animation_url === "string" ? metadata.animation_url : undefined;
}

export function getImageUrlFromTokenUri(tokenUri?: string) {
  if (!tokenUri) {
    return undefined;
  }
  if (tokenUri.startsWith("data:image/")) {
    return tokenUri;
  }

  const metadata = decodeTokenUri(tokenUri);
  return typeof metadata?.image === "string" ? metadata.image : undefined;
}

export function build3DBeastMetadata(input: Build3DBeastTokenUriInput): DecodedTokenMetadata {
  const traits = generateBeastTraits(input.prompt, input.tokenId);
  const attributes: TokenAttribute[] = [
    { trait_type: "Rarity", value: traits.rarity },
    { trait_type: "Body", value: traits.body },
    { trait_type: "Eyes", value: traits.eyes },
    { trait_type: "Horns", value: traits.horns },
    { trait_type: "Aura", value: traits.aura },
    { trait_type: "Power Word", value: traits.powerWord },
    ...(input.traits ?? [])
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

  const animationUrl = input.modelUrl || input.animationUrl;

  return {
    name: input.name ?? (input.tokenId ? `${traits.name} #${input.tokenId}` : traits.name),
    description:
      input.lore ??
      "A MonBeast Arena 3D fighter generated from a prompt. Official stats, ownership, and battle outcomes live on Monad.",
    image: input.renderedImageUrl || generateBeastImageDataUri(input.prompt, input.tokenId),
    ...(animationUrl ? { animation_url: animationUrl } : {}),
    attributes
  };
}

export function build3DBeastTokenUri(input: Build3DBeastTokenUriInput) {
  return metadataToDataUri(build3DBeastMetadata(input));
}

export function metadataToDataUri(metadata: object): string {
  return `${JSON_DATA_URI_PREFIX}${base64Encode(JSON.stringify(metadata))}`;
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
