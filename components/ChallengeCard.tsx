"use client";

import { ShieldAlert, XCircle } from "lucide-react";
import { BeastCard } from "@/components/BeastCard";
import { cn, shortenAddress } from "@/lib/format";
import type { UiChallenge } from "@/lib/arenaTypes";
import type { MockChallenge } from "@/lib/mockData";

type ChallengeCardProps = {
  challenge: MockChallenge | UiChallenge;
  selected?: boolean;
  onSelect: () => void;
  onCancel?: () => void;
  isOwnChallenge?: boolean;
  cancelDisabled?: boolean;
  selectDisabled?: boolean;
};

export function ChallengeCard({
  challenge,
  selected = false,
  onSelect,
  onCancel,
  isOwnChallenge = false,
  cancelDisabled = false,
  selectDisabled = false
}: ChallengeCardProps) {
  const beast = "beast" in challenge ? challenge.beast : undefined;
  const challengeId = "id" in challenge ? String(challenge.id) : "";
  const challenger = challenge.challenger;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[var(--panel)] p-3 transition",
        selected
          ? "border-[var(--monad-purple)] ring-2 ring-[rgba(131,110,249,0.24)]"
          : "border-[var(--border)]"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--gold)]">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          {isOwnChallenge ? "Your challenge" : "Open challenge"}
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
          <span>#{challengeId}</span>
          <span>{shortenAddress(challenger)}</span>
        </div>
      </div>
      {beast ? (
        <BeastCard
          beast={beast}
          variant="compact"
          selected={selected}
          actionLabel="Choose rival"
          onAction={onSelect}
          actionDisabled={selectDisabled}
          actionTitle={selectDisabled ? "Select a different beast to fight this challenge." : undefined}
          secondaryActionLabel={isOwnChallenge ? "Cancel Challenge" : undefined}
          onSecondaryAction={onCancel}
          secondaryActionDisabled={cancelDisabled}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm font-bold text-[var(--text-muted)]">
          Loading rival beast...
        </div>
      )}
      {isOwnChallenge && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/10 p-3 text-xs font-bold uppercase tracking-[0.12em] text-[#FDE68A]">
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Cancel to unlock this beast
        </div>
      )}
    </div>
  );
}
