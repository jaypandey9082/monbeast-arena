import { Activity } from "lucide-react";
import type { BeastCardData } from "@/components/BeastCard";
import { formatTokenId } from "@/lib/format";

type BattleReplayProps = {
  winner?: BeastCardData;
  loser?: BeastCardData;
  winnerPower?: string | number;
  loserPower?: string | number;
};

export function BattleReplay({ winner, loser, winnerPower, loserPower }: BattleReplayProps) {
  const loserId = loser ? formatTokenId(String(loser.id)) : "the loser NFT";
  const lines = [
    "Both beasts entered the arena.",
    "Power calculated from ATK, DEF, HP, SPD, level, and battle entropy.",
    winnerPower ? `Winner power: ${winnerPower}` : "Battle resolved by the smart contract.",
    loserPower ? `Loser power: ${loserPower}` : undefined,
    winner && loser ? `NFT ${loserId} transferred to the winner.` : "Ownership updated on-chain."
  ].filter((line): line is string => Boolean(line));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-black/25 p-4">
      <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--monad-purple)]">
        <Activity className="h-4 w-4" aria-hidden="true" />
        Battle replay
      </div>
      <ol className="space-y-3">
        {lines.map((line, index) => (
          <li key={line} className="flex gap-3 text-sm leading-6 text-[var(--text-secondary)]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-black text-[var(--text-primary)]">
              {index + 1}
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
