import { decodeEventLog, type Abi } from "viem";
import type { BattleResult } from "@/lib/arenaTypes";

type ReceiptLike = {
  logs?: readonly unknown[];
  blockNumber?: bigint;
  transactionHash?: string;
};

type OwnershipInferenceParams = {
  challengeId?: string;
  myBeastId: string;
  rivalBeastId: string;
  myBeastOwnerAfter?: string;
  rivalBeastOwnerAfter?: string;
  myBeastWinsAfter?: number;
  rivalBeastWinsAfter?: number;
  myBeastLevelAfter?: number;
  rivalBeastLevelAfter?: number;
  txHash?: string;
};

export function parseBattleResolvedFromReceipt(receipt: ReceiptLike, abi: Abi): BattleResult | null {
  for (const log of receipt.logs ?? []) {
    const value = log as {
      data?: `0x${string}`;
      topics?: readonly [`0x${string}`, ...`0x${string}`[]];
      transactionHash?: string;
    };

    if (!value.data || !value.topics) {
      continue;
    }

    try {
      const decoded = decodeEventLog({
        abi,
        data: value.data,
        topics: [...value.topics] as [`0x${string}`, ...`0x${string}`[]]
      });

      if (decoded.eventName !== "BattleResolved") {
        continue;
      }

      const args = decoded.args as Record<string, unknown> | readonly unknown[];
      const byName = args as Record<string, unknown>;
      const byIndex = args as readonly unknown[];

      return normalizeBattleResult({
        challengeId: valueToString(byName.challengeId ?? byIndex[0]),
        winnerId: valueToString(byName.winnerId ?? byIndex[1] ?? byIndex[0]),
        loserId: valueToString(byName.loserId ?? byIndex[2] ?? byIndex[1]),
        winnerAddress: stringValue(byName.winner ?? byIndex[3] ?? byIndex[2]),
        loserAddress: stringValue(byName.loser ?? byIndex[4] ?? byIndex[3]),
        winnerPower: valueToString(byName.winnerPower ?? byIndex[5]),
        loserPower: valueToString(byName.loserPower ?? byIndex[6]),
        txHash: value.transactionHash ?? receipt.transactionHash,
        blockNumber: receipt.blockNumber?.toString()
      });
    } catch {
      // Ignore logs that do not match the MonBeast battle event.
    }
  }

  return null;
}

export function inferBattleResultFromOwnership(params: OwnershipInferenceParams): BattleResult | null {
  const sameFinalOwner =
    params.myBeastOwnerAfter &&
    params.rivalBeastOwnerAfter &&
    params.myBeastOwnerAfter.toLowerCase() === params.rivalBeastOwnerAfter.toLowerCase();

  if (!sameFinalOwner) {
    return normalizeBattleResult({
      challengeId: params.challengeId,
      winnerId: "",
      loserId: "",
      winnerAddress: params.myBeastOwnerAfter ?? params.rivalBeastOwnerAfter,
      txHash: params.txHash,
      inferred: true
    });
  }

  const myScore = (params.myBeastWinsAfter ?? 0) * 1000 + (params.myBeastLevelAfter ?? 0);
  const rivalScore =
    (params.rivalBeastWinsAfter ?? 0) * 1000 + (params.rivalBeastLevelAfter ?? 0);
  const myWon = myScore >= rivalScore;

  return normalizeBattleResult({
    challengeId: params.challengeId,
    winnerId: myWon ? params.myBeastId : params.rivalBeastId,
    loserId: myWon ? params.rivalBeastId : params.myBeastId,
    winnerAddress: params.myBeastOwnerAfter,
    loserAddress: myWon ? params.rivalBeastOwnerAfter : params.myBeastOwnerAfter,
    txHash: params.txHash,
    inferred: true
  });
}

export function normalizeBattleResult(result: BattleResult): BattleResult {
  return {
    ...result,
    challengeId: result.challengeId || undefined,
    winnerId: result.winnerId || "",
    loserId: result.loserId || "",
    winnerPower: result.winnerPower || undefined,
    loserPower: result.loserPower || undefined
  };
}

function valueToString(value: unknown) {
  if (typeof value === "bigint" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
