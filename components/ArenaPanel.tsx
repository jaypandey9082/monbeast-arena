"use client";

import dynamic from "next/dynamic";
import { Box, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Address, zeroAddress } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { BeastModelCard, type BeastModelCardData } from "@/components/BeastModelCard";
import { EmptyState } from "@/components/EmptyState";
import { GeneratingCreatureStage } from "@/components/GeneratingCreatureStage";
import { StatBar } from "@/components/StatBar";
import { TxChip } from "@/components/TxChip";
import {
  hasContractAddress,
  isContractAddressConfigured,
  isContractAddressValid,
  MONBEAST_CONTRACT_ADDRESS,
  monbeastAbi
} from "@/lib/contract";
import { formatTokenId } from "@/lib/format";
import {
  LOCAL_CREATURES_EVENT,
  makeLocalCreature,
  readLocalCreatures,
  upsertLocalCreature,
  type LocalCreature
} from "@/lib/localCreatures";
import { MONAD_TESTNET_CHAIN_ID } from "@/lib/monad";

const ModelViewer3D = dynamic(
  () => import("@/components/ModelViewer3D").then((module) => module.ModelViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="grid aspect-[4/3] place-items-center rounded-t-2xl bg-[#07050d] text-white/35">
        <Box className="h-5 w-5 animate-pulse" aria-hidden="true" />
      </div>
    )
  }
);

export function ArenaPanel() {
  const { address, isConnected } = useAccount();
  const contractAddress = MONBEAST_CONTRACT_ADDRESS ?? zeroAddress;
  const canRead = Boolean(address && hasContractAddress && isContractAddressValid);
  const [localCreatures, setLocalCreatures] = useState<LocalCreature[]>([]);
  const [checkingTaskId, setCheckingTaskId] = useState<string>();

  const refreshLocalCreatures = useCallback(() => {
    setLocalCreatures(readLocalCreatures());
  }, []);

  useEffect(() => {
    refreshLocalCreatures();

    window.addEventListener("storage", refreshLocalCreatures);
    window.addEventListener(LOCAL_CREATURES_EVENT, refreshLocalCreatures);

    return () => {
      window.removeEventListener("storage", refreshLocalCreatures);
      window.removeEventListener(LOCAL_CREATURES_EVENT, refreshLocalCreatures);
    };
  }, [refreshLocalCreatures]);

  const {
    data: beastIds,
    isLoading: idsLoading,
    refetch: refetchIds
  } = useReadContract({
    address: contractAddress,
    abi: monbeastAbi,
    functionName: "getBeastsOfOwner",
    args: [address ?? zeroAddress],
    chainId: MONAD_TESTNET_CHAIN_ID,
    query: { enabled: canRead }
  });

  const ids = useMemo(() => (Array.isArray(beastIds) ? beastIds : []), [beastIds]);

  const {
    data: beastReads,
    isLoading: beastsLoading,
    refetch: refetchBeasts
  } = useReadContracts({
    allowFailure: true,
    contracts: ids.map((tokenId) => ({
      address: contractAddress,
      abi: monbeastAbi,
      functionName: "getBeast",
      args: [tokenId],
      chainId: MONAD_TESTNET_CHAIN_ID
    })),
    query: { enabled: canRead && ids.length > 0 }
  });

  const chainBeasts = useMemo(
    () =>
      ids
        .map((tokenId, index) => normalizeChainBeast(beastReads?.[index]?.result, tokenId, address))
        .filter((beast): beast is BeastModelCardData => Boolean(beast)),
    [address, beastReads, ids]
  );

  const loadingChainBeasts = idsLoading || beastsLoading;

  async function refreshCreatureStatus(creature: LocalCreature) {
    if (!creature.taskId) {
      return;
    }

    try {
      setCheckingTaskId(creature.taskId);
      const response = await fetch("/api/beast/three-d/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: creature.taskId })
      });
      const data = (await response.json()) as ThreeDStatusResponse;
      const modelUrl = data.modelUrl;
      const renderedImageUrl = data.renderedImageUrl || data.previewUrl || creature.renderedImageUrl;
      const status = normalizeStatus(data.status, Boolean(modelUrl));

      upsertLocalCreature(
        makeLocalCreature({
          id: creature.id,
          prompt: creature.prompt,
          modelUrl,
          renderedImageUrl,
          tokenURI: creature.tokenURI,
          taskId: creature.taskId,
          source: modelUrl || renderedImageUrl ? "tripo" : creature.source,
          status,
          progress: data.progress ?? creature.progress,
          message: data.message || creature.message,
          enhancedPrompt: creature.enhancedPrompt,
          createdAt: creature.createdAt
        })
      );
      refreshLocalCreatures();
    } finally {
      setCheckingTaskId(undefined);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-7">
      <header className="max-w-3xl pt-4">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--monad-purple)]">
          Arena
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
          Choose a beast. Enter the arena.
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Your generated fighters live here first. Minted NFTs will appear above once the contract is configured.
        </p>
      </header>

      <ArenaSection
        title="Your beasts"
        description="Minted MonBeast NFTs owned by the connected wallet."
        action={
          isConnected && isContractAddressConfigured ? (
            <button
              type="button"
              onClick={() => {
                void refetchIds();
                void refetchBeasts();
              }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-white/58 transition hover:border-[var(--monad-purple)] hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          ) : undefined
        }
      >
        {renderYourBeasts({
          isConnected,
          loading: loadingChainBeasts,
          beasts: chainBeasts
        })}
      </ArenaSection>

      <ArenaSection
        title="My creatures"
        description="Generated 3D beasts saved in this browser before or after minting."
        action={
          <button
            type="button"
            onClick={refreshLocalCreatures}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-white/58 transition hover:border-[var(--monad-purple)] hover:text-white"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
      >
        {localCreatures.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {localCreatures.map((creature) => (
              <LocalCreatureCard
                key={`${creature.id}-${creature.createdAt}`}
                creature={creature}
                checking={checkingTaskId === creature.taskId}
                onCheckStatus={() => void refreshCreatureStatus(creature)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No generated creatures yet."
            description="Generate a beast on the Create page and it will appear here."
          />
        )}
      </ArenaSection>
    </section>
  );
}

function ArenaSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/28 p-4 backdrop-blur">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-white/48">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function renderYourBeasts({
  isConnected,
  loading,
  beasts
}: {
  isConnected: boolean;
  loading: boolean;
  beasts: BeastModelCardData[];
}) {
  if (!isConnected) {
    return (
      <EmptyState
        title="Connect wallet to view your beasts."
        description="Minted MonBeast NFTs from your wallet will appear here."
      />
    );
  }

  if (!isContractAddressConfigured) {
    return (
      <EmptyState
        title="Contract not configured yet."
        description="Deploy MonBeastArena and set NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS to read minted beasts."
      />
    );
  }

  if (!isContractAddressValid) {
    return (
      <EmptyState
        title="Invalid contract address."
        description="Check NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS in .env.local."
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!beasts.length) {
    return <EmptyState title="No minted beasts yet." description="Mint one from Create first." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {beasts.map((beast) => (
        <BeastModelCard key={String(beast.id)} beast={beast} variant="compact" />
      ))}
    </div>
  );
}

type ThreeDStatusResponse = {
  status?: string;
  progress?: number;
  modelUrl?: string;
  renderedImageUrl?: string;
  previewUrl?: string;
  message?: string;
};

function LocalCreatureCard({
  creature,
  checking,
  onCheckStatus
}: {
  creature: LocalCreature;
  checking?: boolean;
  onCheckStatus: () => void;
}) {
  const tokenLabel = creature.mintedTokenId
    ? formatTokenId(creature.mintedTokenId)
    : `#${creature.id.slice(0, 6)}`;
  const isProviderTask = Boolean(creature.taskId && creature.source === "tripo");
  const isBuilding =
    isProviderTask &&
    !creature.modelUrl &&
    !creature.renderedImageUrl &&
    creature.status !== "failed" &&
    creature.status !== "fallback";
  const sourceLabel = creature.modelUrl
    ? "3D model"
    : creature.renderedImageUrl
      ? "Image preview"
      : isProviderTask
        ? "Generating"
        : "Local preview";

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0c0716]/88 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-[rgba(131,110,249,0.55)]">
      <div className="relative">
        {isBuilding ? (
          <GeneratingCreatureStage
            prompt={creature.prompt}
            progress={creature.progress}
            status={creature.status || "generating"}
            className="aspect-[4/3] min-h-0 rounded-none border-0"
          />
        ) : (
          <ModelViewer3D
            modelUrl={creature.modelUrl}
            posterUrl={creature.renderedImageUrl}
            prompt={creature.prompt}
            className="aspect-[4/3] min-h-0 rounded-none border-0 bg-[radial-gradient(circle_at_50%_18%,rgba(131,110,249,0.22),rgba(5,5,14,0.95)_58%)]"
            autoRotate
            preferPoster={!creature.modelUrl}
          />
        )}
        <div className="absolute left-4 top-4">
          <TxChip
            status={isBuilding ? "pending" : creature.mintedTokenId ? "confirmed" : "ready"}
            label={isBuilding ? "Building" : creature.mintedTokenId ? "Minted" : "Draft"}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0c0716] to-transparent" />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/42">
              Beast {tokenLabel}
            </p>
            <h3 className="mt-1 line-clamp-1 text-xl font-black text-white">
              {creature.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/70">
            {creature.rarity}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-white/48">
          {creature.prompt}
        </p>

        <div className="mt-4 grid gap-3">
          <StatBar label="ATK" value={creature.stats.atk} accent="#EF4444" />
          <StatBar label="DEF" value={creature.stats.def} accent="#836EF9" />
          <StatBar label="HP" value={creature.stats.hp} accent="#22C55E" />
          <StatBar label="SPD" value={creature.stats.spd} accent="#FBBF24" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <DetailPill>{sourceLabel}</DetailPill>
          <DetailPill>Lvl {creature.stats.level}</DetailPill>
          <DetailPill>{creature.stats.wins}W {creature.stats.losses}L</DetailPill>
        </div>

        {isProviderTask && !creature.modelUrl ? (
          <button
            type="button"
            onClick={onCheckStatus}
            disabled={checking}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--monad-purple)] px-4 text-sm font-black text-white transition hover:bg-[var(--purple-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={checking ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            {checking ? "Checking status" : "Check model status"}
          </button>
        ) : (
          <button
            type="button"
            className="mt-5 min-h-11 w-full rounded-xl bg-[var(--monad-purple)] px-4 text-sm font-black text-white transition hover:bg-[var(--purple-hover)]"
          >
            {creature.mintedTokenId ? "Choose for arena" : "Mint to battle"}
          </button>
        )}
      </div>
    </article>
  );
}

function DetailPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-bold uppercase tracking-[0.1em]">
      {children}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="grid h-28 w-28 place-items-center rounded-xl bg-white/[0.06]">
        <Box className="h-5 w-5 animate-pulse text-white/35" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-white/[0.06]" />
        <div className="h-5 w-40 rounded bg-white/[0.06]" />
        <div className="h-3 w-full rounded bg-white/[0.05]" />
        <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

function normalizeChainBeast(
  raw: unknown,
  tokenId: bigint,
  owner?: Address
): BeastModelCardData | undefined {
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
    locked: false
  };
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

function normalizeStatus(status: string | undefined, hasModel: boolean) {
  if (hasModel) {
    return "complete" as const;
  }

  const normalized = status?.toLowerCase();
  if (normalized === "failed" || normalized === "error" || normalized === "cancelled") {
    return "failed" as const;
  }
  if (normalized === "success" || normalized === "complete" || normalized === "completed") {
    return "waiting" as const;
  }

  return "generating" as const;
}
