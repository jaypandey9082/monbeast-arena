import { Zap } from "lucide-react";
import { cn } from "@/lib/format";

type PowerComparisonProps = {
  winnerPower?: string | number;
  loserPower?: string | number;
};

export function PowerComparison({ winnerPower, loserPower }: PowerComparisonProps) {
  const winner = numberValue(winnerPower);
  const loser = numberValue(loserPower);
  const max = Math.max(winner, loser, 1);

  if (!winnerPower && !loserPower) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-black/25 p-4 text-sm leading-6 text-[var(--text-muted)]">
        Battle power was resolved by the smart contract.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-black/25 p-4">
      <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--gold)]">
        <Zap className="h-4 w-4" aria-hidden="true" />
        Power comparison
      </div>
      <PowerBar label="Winner" value={winner} max={max} tone="winner" />
      <PowerBar label="Loser" value={loser} max={max} tone="loser" />
    </div>
  );
}

function PowerBar({
  label,
  value,
  max,
  tone
}: {
  label: string;
  value: number;
  max: number;
  tone: "winner" | "loser";
}) {
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        <span>{label}</span>
        <span className={tone === "winner" ? "text-[#86EFAC]" : "text-[#FCA5A5]"}>
          {value.toLocaleString("en-US")}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "winner" ? "bg-[#22C55E]" : "bg-[#EF4444]"
          )}
          style={{ width: `${Math.max(8, Math.round((value / max) * 100))}%` }}
        />
      </div>
    </div>
  );
}

function numberValue(value?: string | number) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value) || 0;
  }

  return 0;
}
