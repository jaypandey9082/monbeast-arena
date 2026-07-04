import type { Address } from "viem";

export type UiBeast = {
  id: bigint | number | string;
  prompt: string;
  imageURI?: string;
  atk: number;
  def: number;
  hp: number;
  spd: number;
  level: number;
  wins: number;
  losses: number;
  owner?: string;
  locked?: boolean;
};

export type UiChallenge = {
  id: bigint | number | string;
  beastId: bigint | number | string;
  challenger: string;
  beast?: UiBeast;
  open: boolean;
};

export type BattleResult = {
  challengeId?: string;
  winnerId: string;
  loserId: string;
  winnerAddress?: string;
  loserAddress?: string;
  winnerPower?: string;
  loserPower?: string;
  txHash?: string;
  blockNumber?: string;
  timestamp?: number;
  inferred?: boolean;
};

export type BattleFeedItem = {
  id: string;
  winnerId: string;
  loserId: string;
  winnerAddress?: string;
  loserAddress?: string;
  txHash?: string;
  timestamp?: number;
};

export type LeaderboardBeast = {
  id: string;
  prompt: string;
  imageURI?: string;
  owner?: string;
  atk: number;
  def: number;
  hp: number;
  spd: number;
  level: number;
  wins: number;
  losses: number;
  locked?: boolean;
};

export function normalizeBeast(
  raw: unknown,
  tokenId: bigint | number | string,
  owner?: Address | string,
  locked?: boolean
): UiBeast | undefined {
  if (!raw) {
    return undefined;
  }

  const value = raw as readonly unknown[] & Record<string, unknown>;

  return {
    id: tokenId,
    prompt: stringValue(value.prompt ?? value[0]),
    imageURI: stringValue(value.imageURI ?? value[1]),
    atk: numberValue(value.atk ?? value[2]),
    def: numberValue(value.def ?? value[3]),
    hp: numberValue(value.hp ?? value[4]),
    spd: numberValue(value.spd ?? value[5]),
    level: numberValue(value.level ?? value[6]),
    wins: numberValue(value.wins ?? value[7]),
    losses: numberValue(value.losses ?? value[8]),
    owner,
    locked
  };
}

export function normalizeChallenge(raw: unknown): UiChallenge | undefined {
  if (!raw) {
    return undefined;
  }

  const value = raw as readonly unknown[] & Record<string, unknown>;
  const id = idValue(value.id ?? value[0]);
  const beastId = idValue(value.beastId ?? value[1]);
  const challenger = stringValue(value.challenger ?? value[2]);

  if (!id || !beastId || !challenger) {
    return undefined;
  }

  return {
    id,
    beastId,
    challenger,
    open: true
  };
}

export function sameId(a?: bigint | number | string, b?: bigint | number | string) {
  if (a === undefined || b === undefined) {
    return false;
  }

  return String(a) === String(b);
}

export function idToBigInt(id: bigint | number | string) {
  return typeof id === "bigint" ? id : BigInt(id);
}

export function idToString(id?: bigint | number | string) {
  return id === undefined ? "" : String(id);
}

function idValue(value: unknown) {
  if (typeof value === "bigint" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  return undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }

  return 0;
}
