"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { type Address, zeroAddress } from "viem";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import { BeastCard, type BeastCardData } from "@/components/BeastCard";
import { EmptyState } from "@/components/EmptyState";
import {
  hasContractAddress,
  isContractAddressConfigured,
  isContractAddressValid,
  MONBEAST_CONTRACT_ADDRESS,
  monbeastAbi
} from "@/lib/contract";
import { cn } from "@/lib/format";
import { MONAD_TESTNET_CHAIN_ID, isMonadTestnet } from "@/lib/monad";

type MyBeastsPanelProps = {
  refreshKey?: number;
  className?: string;
};

export function MyBeastsPanel({ refreshKey = 0, className }: MyBeastsPanelProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = MONBEAST_CONTRACT_ADDRESS ?? zeroAddress;
  const canRead = Boolean(address && hasContractAddress);

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
    query: {
      enabled: canRead
    }
  });

  const ids = Array.isArray(beastIds) ? beastIds : [];

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
    query: {
      enabled: canRead && ids.length > 0
    }
  });

  useEffect(() => {
    if (!canRead) {
      return;
    }

    void refetchIds();
    void refetchBeasts();
  }, [canRead, refreshKey, refetchBeasts, refetchIds]);

  if (!isConnected) {
    return (
      <PanelShell className={className}>
        <EmptyState title="Connect wallet to view your beasts." description="Minted NFTs will appear here after minting." />
      </PanelShell>
    );
  }

  if (!isContractAddressConfigured) {
    return (
      <PanelShell className={className}>
        <EmptyState
          title="Minting needs a deployed contract."
          description="Deploy MonBeastArena, then set NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS in .env.local."
        />
      </PanelShell>
    );
  }

  if (!isContractAddressValid) {
    return (
      <PanelShell className={className}>
        <EmptyState title="Invalid contract address" description="Check NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS." />
      </PanelShell>
    );
  }

  const loading = idsLoading || beastsLoading;
  const beasts = ids
    .map((tokenId, index) => normalizeBeast(beastReads?.[index]?.result, tokenId, address))
    .filter((beast): beast is BeastCardData => Boolean(beast));

  return (
    <PanelShell className={className}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--text-primary)]">
            My Beasts
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Official on-chain stats from `getBeast`.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void refetchIds();
            void refetchBeasts();
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-[var(--text-secondary)] transition hover:border-[var(--monad-purple)] hover:text-white"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {!isMonadTestnet(chainId) && (
        <p className="mb-4 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/10 p-3 text-sm text-[#FDE68A]">
          Reads use Monad Testnet. Switch wallet before minting.
        </p>
      )}

      {loading ? (
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : beasts.length ? (
        <div className="grid gap-4">
          {beasts.map((beast) => (
            <BeastCard key={String(beast.id)} beast={beast} />
          ))}
        </div>
      ) : (
        <EmptyState title="No beasts yet." description="Create your first fighter." />
      )}
    </PanelShell>
  );
}

function PanelShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn("rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5", className)}
    >
      {children}
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[128px_1fr]">
      <div className="aspect-square rounded-xl bg-white/[0.06]" />
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-white/[0.06]" />
        <div className="h-6 w-56 rounded bg-white/[0.06]" />
        <div className="h-3 w-full rounded bg-white/[0.05]" />
        <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

function normalizeBeast(
  raw: unknown,
  tokenId: bigint,
  owner?: Address
): BeastCardData | undefined {
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
    owner
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
