import { Clock3 } from "lucide-react";
import type { BattleFeedItem } from "@/lib/arenaTypes";
import { safeExternalLinkProps, shortHash, txUrl } from "@/lib/explorer";
import { formatTokenId, shortenAddress } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

type RecentBattlesProps = {
  battles: BattleFeedItem[];
};

export function RecentBattles({ battles }: RecentBattlesProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[var(--text-primary)]">
        <Clock3 className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
        Recent arena bloodline
      </div>

      {battles.length ? (
        <div className="grid gap-3">
          {battles.map((battle) => (
            <div
              key={battle.id}
              className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-[var(--text-primary)]">
                  Winner {formatTokenId(battle.winnerId || "?")} claimed{" "}
                  {formatTokenId(battle.loserId || "?")}
                </p>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#86EFAC]">
                  NFT transferred
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                {battle.winnerAddress && <span>{shortenAddress(battle.winnerAddress)}</span>}
                {battle.txHash && (
                  <a
                    href={txUrl(battle.txHash)}
                    {...safeExternalLinkProps}
                    className="font-bold text-[var(--monad-purple)] hover:text-white"
                  >
                    {shortHash(battle.txHash)}
                  </a>
                )}
                {battle.timestamp && <span>{new Date(battle.timestamp).toLocaleTimeString()}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No battles in this session."
          description="Recent battle activity appears here after you accept a challenge."
          className="min-h-36"
        />
      )}
    </section>
  );
}
