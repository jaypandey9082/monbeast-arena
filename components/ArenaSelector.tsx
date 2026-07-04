"use client";

import { Swords } from "lucide-react";
import { BeastCard } from "@/components/BeastCard";
import type { UiBeast, UiChallenge } from "@/lib/arenaTypes";
import type { MockBeast, MockChallenge } from "@/lib/mockData";

type ArenaSelectorProps = {
  selectedBeast?: MockBeast | UiBeast;
  selectedChallenge?: MockChallenge | UiChallenge;
  onFight: () => void;
  disabledReason?: string;
};

export function ArenaSelector({
  selectedBeast,
  selectedChallenge,
  onFight,
  disabledReason
}: ArenaSelectorProps) {
  const rivalBeast = selectedChallenge?.beast;
  const ready = Boolean(selectedBeast && rivalBeast && !disabledReason);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/32 p-4 backdrop-blur">
      <div className="grid items-center gap-5 lg:grid-cols-[1fr_110px_1fr]">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Choose your beast
          </p>
          {selectedBeast ? (
            <BeastCard beast={selectedBeast} variant="compact" selected />
          ) : (
            <Placeholder label="No fighter selected" />
          )}
        </div>

        <div className="grid place-items-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-[rgba(131,110,249,0.45)] bg-[rgba(131,110,249,0.12)] text-lg font-black text-white">
            VS
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Choose rival
          </p>
          {rivalBeast ? (
            <BeastCard beast={rivalBeast} variant="compact" selected />
          ) : (
            <Placeholder label="No rival selected" />
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-white/52">
          {disabledReason ?? "Hardcore PvP: if you lose, your NFT transfers forever."}
        </p>
        <button
          type="button"
          disabled={!ready}
          onClick={onFight}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--monad-purple)] px-6 text-sm font-black text-white transition hover:bg-[var(--purple-hover)] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-[var(--text-muted)]"
        >
          <Swords className="h-4 w-4" aria-hidden="true" />
          Fight on Monad
        </button>
      </div>
    </section>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="grid min-h-[132px] place-items-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm font-bold text-[var(--text-muted)]">
      {label}
    </div>
  );
}
