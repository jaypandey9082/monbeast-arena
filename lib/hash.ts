import { keccak256, toBytes } from "viem";

export type HexSeed = `0x${string}`;

export function createPromptSeed(prompt: string, salt = ""): HexSeed {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const normalizedSalt = salt.trim().toLowerCase();

  return keccak256(toBytes(`${normalizedPrompt}|${normalizedSalt}`));
}

export function seedByte(seed: string, index: number) {
  const hex = seed.replace(/^0x/, "");
  const offset = (index * 2) % Math.max(hex.length, 2);
  const byte = hex.slice(offset, offset + 2).padEnd(2, "0");

  return Number.parseInt(byte, 16);
}

export function seedInt(seed: string, startIndex: number, byteCount = 2) {
  let value = 0;

  for (let i = 0; i < byteCount; i++) {
    value = value * 256 + seedByte(seed, startIndex + i);
  }

  return value;
}

export function escapeXml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function safeTruncate(text: string, max: number) {
  const trimmed = text.trim();

  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}
