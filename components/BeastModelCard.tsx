"use client";

import dynamic from "next/dynamic";
import { Box, Lock, Swords } from "lucide-react";
import { generateBeastTraits } from "@/lib/beastTraits";
import { cn, formatTokenId, shortenAddress } from "@/lib/format";
import { decodeTokenUri, getAnimationUrlFromTokenUri, getImageUrlFromTokenUri } from "@/lib/tokenMetadata";
import type { MockBeast } from "@/lib/mockData";
import type { UiBeast } from "@/lib/arenaTypes";
import { StatBar } from "@/components/StatBar";
import { TxChip } from "@/components/TxChip";

const ModelViewer3D = dynamic(
  () => import("@/components/ModelViewer3D").then((module) => module.ModelViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="grid aspect-square place-items-center rounded-2xl border border-white/10 bg-black/30 text-[var(--text-muted)]">
        <Box className="h-5 w-5 animate-pulse" aria-hidden="true" />
      </div>
    )
  }
);

export type BeastModelCardData = UiBeast & {
  name?: string;
  rarity?: string;
};

type BeastModelCardProps = {
  beast: MockBeast | BeastModelCardData;
  selected?: boolean;
  locked?: boolean;
  variant?: "full" | "compact" | "leaderboard";
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionTitle?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionDisabled?: boolean;
  secondaryActionTitle?: string;
  className?: string;
};

export function BeastModelCard({
  beast,
  selected = false,
  locked = beast.locked,
  variant = "full",
  actionLabel,
  onAction,
  actionDisabled = false,
  actionTitle,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionDisabled = false,
  secondaryActionTitle,
  className
}: BeastModelCardProps) {
  const tokenId = String(beast.id);
  const traits = generateBeastTraits(beast.prompt, tokenId);
  const metadata = decodeTokenUri(beast.imageURI);
  const name = beast.name ?? metadata?.name ?? traits.name;
  const rarity = beast.rarity ?? traitValue(metadata, "Rarity") ?? traits.rarity;
  const owner = beast.owner ? shortenAddress(beast.owner) : "On-chain";
  const modelUrl = getAnimationUrlFromTokenUri(beast.imageURI);
  const posterUrl = getImageUrlFromTokenUri(beast.imageURI);
  const compact = variant === "compact";
  const leaderboard = variant === "leaderboard";

  if (leaderboard) {
    return (
      <div className={cn("flex min-w-0 items-center gap-4", className)}>
        <ModelViewer3D
          modelUrl={modelUrl}
          posterUrl={posterUrl}
          prompt={beast.prompt}
          compact
          className="h-16 w-16 shrink-0 rounded-xl"
          autoRotate={false}
          preferPoster
        />
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-[var(--text-primary)]">{name}</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {formatTokenId(tokenId)} · {beast.owner ? shortenAddress(beast.owner) : "Unknown owner"}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {rarity} · ATK {beast.atk} / DEF {beast.def} / HP {beast.hp} / SPD {beast.spd}
          </p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-black/32 backdrop-blur transition",
        selected
          ? "border-[var(--monad-purple)] ring-2 ring-[rgba(131,110,249,0.24)]"
          : "border-[var(--border)] hover:border-[var(--border-strong)]",
        className
      )}
    >
      <div className={cn("grid gap-4 p-4", compact ? "grid-cols-[112px_1fr]" : "")}>
        <ModelViewer3D
          modelUrl={modelUrl}
          posterUrl={posterUrl}
          prompt={beast.prompt}
          compact={compact}
          className={compact ? "h-28 w-28 rounded-xl" : ""}
          autoRotate={!compact}
          preferPoster={compact}
        />

        <div className={compact ? "min-w-0" : ""}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Beast {formatTokenId(tokenId)}
              </p>
              <h3 className="mt-1 truncate text-lg font-black text-[var(--text-primary)]">
                {name}
              </h3>
            </div>
            <TxChip
              status={locked ? "pending" : "confirmed"}
              label={locked ? "Locked" : "Available"}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
            <span>Lvl {beast.level}</span>
            <span>{beast.wins}W</span>
            <span>{beast.losses}L</span>
            <span>{owner}</span>
          </div>

          {!compact && (
            <div className="mt-5 grid gap-3">
              <StatBar label="ATK" value={beast.atk} accent="#EF4444" />
              <StatBar label="DEF" value={beast.def} accent="#836EF9" />
              <StatBar label="HP" value={beast.hp} accent="#22C55E" />
              <StatBar label="SPD" value={beast.spd} accent="#FBBF24" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">
              {rarity}
            </span>
          <span className="rounded-full border border-[rgba(131,110,249,0.25)] bg-[rgba(131,110,249,0.08)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--monad-purple)]">
            {modelUrl ? "3D model" : "Procedural 3D"}
          </span>
            {locked && <Lock className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />}
          </div>

          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              disabled={actionDisabled}
              title={actionTitle}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--monad-purple)] hover:bg-[rgba(131,110,249,0.14)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)] disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]"
            >
              <Swords className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              disabled={secondaryActionDisabled}
              title={secondaryActionTitle}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[rgba(131,110,249,0.28)] bg-[rgba(131,110,249,0.10)] px-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--monad-purple)] hover:bg-[rgba(131,110,249,0.18)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-[var(--text-muted)]"
            >
              <Swords className="h-4 w-4 text-[var(--monad-purple)]" aria-hidden="true" />
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function traitValue(metadata: ReturnType<typeof decodeTokenUri>, traitType: string) {
  const value = metadata?.attributes?.find((attribute) => attribute.trait_type === traitType)?.value;
  return typeof value === "string" ? value : undefined;
}
