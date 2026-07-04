"use client";

import { ArrowRight, ExternalLink, ShieldCheck, X } from "lucide-react";
import { BattleReplay } from "@/components/BattleReplay";
import { BeastCard } from "@/components/BeastCard";
import { PowerComparison } from "@/components/PowerComparison";
import { TransferProof } from "@/components/TransferProof";
import { TxChip } from "@/components/TxChip";
import type { BattleResult } from "@/lib/arenaTypes";
import { safeExternalLinkProps, txUrl } from "@/lib/explorer";
import { formatTokenId, shortenAddress } from "@/lib/format";
import type { MockBeast } from "@/lib/mockData";
import type { BeastCardData } from "@/components/BeastCard";

type BattleResultModalProps = {
  open: boolean;
  winner?: MockBeast | BeastCardData;
  loser?: MockBeast | BeastCardData;
  result?: BattleResult;
  winnerPower?: number | string;
  loserPower?: number | string;
  txHash?: string;
  onClose: () => void;
  onViewArena?: () => void;
};

export function BattleResultModal({
  open,
  winner,
  loser,
  result,
  winnerPower,
  loserPower,
  txHash,
  onViewArena,
  onClose
}: BattleResultModalProps) {
  if (!open) {
    return null;
  }

  const loserId = result?.loserId ?? (loser ? String(loser.id) : "");
  const winnerAddress = result?.winnerAddress;
  const loserAddress = result?.loserAddress;
  const resolvedTxHash = txHash ?? result?.txHash;
  const resolvedWinnerPower = winnerPower ?? result?.winnerPower;
  const resolvedLoserPower = loserPower ?? result?.loserPower;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
      <section className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[rgba(131,110,249,0.42)] bg-[var(--panel-elevated)] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--monad-purple)]">
              Battle resolved
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black uppercase text-[var(--text-primary)]">
                Winner takes all
              </h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/25 bg-[#22C55E]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#86EFAC]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Confirmed on Monad
              </span>
            </div>
            {result?.inferred && (
              <p className="mt-2 text-sm text-[var(--gold)]">
                Result inferred from post-battle ownership.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:text-white"
            aria-label="Close battle result"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px_1fr]">
          <div className="rounded-2xl border border-[#22C55E]/25 bg-[#22C55E]/[0.04] p-3 shadow-[0_0_50px_rgba(34,197,94,0.12)]">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#86EFAC]">
              Winner · {winner ? formatTokenId(String(winner.id)) : formatTokenId(result?.winnerId ?? "?")}
            </p>
            {winner ? (
              <BeastCard beast={winner} variant="compact" selected />
            ) : (
              <FallbackPanel label={`Winner token ${formatTokenId(result?.winnerId ?? "?")}`} />
            )}
            {resolvedWinnerPower && (
              <p className="mt-3 text-sm font-bold text-[var(--text-secondary)]">
                Winner power: {String(resolvedWinnerPower)}
              </p>
            )}
            {winnerAddress && (
              <p className="mt-2 text-sm font-bold text-[var(--text-muted)]">
                Winner owner: {shortenAddress(winnerAddress)}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(251,191,36,0.25)] bg-black/30 p-4 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-[rgba(131,110,249,0.45)] bg-[rgba(131,110,249,0.14)] text-[var(--text-primary)]">
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              NFT transferred to winner
            </p>
            <p className="mt-3 text-4xl font-black text-[var(--gold)]">
              {loserId ? formatTokenId(loserId) : "NFT"}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              {loserId
                ? `NFT ${formatTokenId(loserId)} transferred to the winner.`
                : "Battle resolved on Monad. Refresh arena to see final ownership."}
            </p>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-[#86EFAC]">
              Ownership changed on-chain.
            </p>
            <div className="mt-5">
              <TxChip status="confirmed" hash={resolvedTxHash} />
            </div>
            {resolvedTxHash && (
              <a
                href={txUrl(resolvedTxHash)}
                {...safeExternalLinkProps}
                className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--text-secondary)] transition hover:text-white"
              >
                View on Explorer
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/[0.035] p-3 opacity-90">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#FCA5A5]">
              Loser · {loser ? formatTokenId(String(loser.id)) : formatTokenId(result?.loserId ?? "?")}
            </p>
            {loser ? (
              <BeastCard beast={loser} variant="compact" />
            ) : (
              <FallbackPanel label={`Loser token ${formatTokenId(result?.loserId ?? "?")}`} />
            )}
            {resolvedLoserPower && (
              <p className="mt-3 text-sm font-bold text-[var(--text-secondary)]">
                Loser power: {String(resolvedLoserPower)}
              </p>
            )}
            {loserAddress && (
              <p className="mt-2 text-sm font-bold text-[var(--text-muted)]">
                Previous owner: {shortenAddress(loserAddress)}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 border-t border-[var(--border)] p-5 lg:grid-cols-3">
          <PowerComparison winnerPower={resolvedWinnerPower} loserPower={resolvedLoserPower} />
          <BattleReplay
            winner={winner}
            loser={loser}
            winnerPower={resolvedWinnerPower}
            loserPower={resolvedLoserPower}
          />
          <TransferProof
            txHash={resolvedTxHash}
            winnerAddress={winnerAddress}
            loserTokenId={loserId}
          />
        </div>

        <div className="grid gap-3 border-t border-[var(--border)] p-5 sm:grid-cols-2">
          {onViewArena && (
            <button
              type="button"
              onClick={onViewArena}
              className="min-h-12 rounded-xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)] transition hover:text-white"
            >
              View updated arena
            </button>
          )}
          {resolvedTxHash && (
            <a
              href={txUrl(resolvedTxHash)}
              {...safeExternalLinkProps}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)] transition hover:text-white"
            >
              View transaction
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl bg-[var(--monad-purple)] text-sm font-black text-white transition hover:bg-[var(--purple-hover)] sm:col-span-2"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function FallbackPanel({ label }: { label: string }) {
  return (
    <div className="grid min-h-[132px] place-items-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-center text-sm font-bold text-[var(--text-muted)]">
      {label}
    </div>
  );
}
