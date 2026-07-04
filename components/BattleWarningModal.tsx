"use client";

import { AlertTriangle, Swords, X } from "lucide-react";
import { BeastCard, type BeastCardData } from "@/components/BeastCard";

type BattleWarningModalProps = {
  open: boolean;
  yourBeast?: BeastCardData;
  rivalBeast?: BeastCardData;
  onCancel: () => void;
  onConfirm: () => void;
  confirming?: boolean;
};

export function BattleWarningModal({
  open,
  yourBeast,
  rivalBeast,
  onCancel,
  onConfirm,
  confirming = false
}: BattleWarningModalProps) {
  if (!open || !yourBeast || !rivalBeast) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-md">
      <section className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[#FBBF24]/35 bg-[var(--panel-elevated)] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FBBF24]/10 text-[#FDE68A]">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--gold)]">
                Hardcore PvP
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase text-[var(--text-primary)]">
                Winner takes all
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                If you lose, your NFT transfers to the opponent forever. This battle is settled on
                Monad in one transaction.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:text-white"
            aria-label="Cancel battle"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_90px_1fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#86EFAC]">
              Your beast
            </p>
            <BeastCard beast={yourBeast} variant="compact" selected />
          </div>
          <div className="grid place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-[rgba(131,110,249,0.48)] bg-[rgba(131,110,249,0.14)] text-xl font-black text-white">
              VS
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#FCA5A5]">
              Rival beast
            </p>
            <BeastCard beast={rivalBeast} variant="compact" selected />
          </div>
        </div>

        <div className="grid gap-3 border-t border-[var(--border)] p-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)] transition hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--monad-purple)] text-sm font-black text-white transition hover:bg-[var(--purple-hover)] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-[var(--text-muted)]"
          >
            <Swords className="h-4 w-4" aria-hidden="true" />
            Accept & Fight
          </button>
        </div>
      </section>
    </div>
  );
}
