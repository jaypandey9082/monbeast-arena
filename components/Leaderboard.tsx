"use client";

import { RefreshCcw, Trophy } from "lucide-react";
import { zeroAddress } from "viem";
import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { BeastMiniCard } from "@/components/BeastMiniCard";
import { ContractStatus } from "@/components/ContractStatus";
import { EmptyState } from "@/components/EmptyState";
import {
  hasContractAddress,
  isContractAddressConfigured,
  isContractAddressValid,
  MONBEAST_CONTRACT_ADDRESS,
  monbeastAbi
} from "@/lib/contract";
import { cn } from "@/lib/format";
import { MONAD_TESTNET_CHAIN_ID } from "@/lib/monad";
import { leaderboardBeasts } from "@/lib/mockData";
import { buildLeaderboardIds, LEADERBOARD_READ_LIMIT, sortLeaderboard } from "@/lib/leaderboard";
import { normalizeBeast, type LeaderboardBeast } from "@/lib/arenaTypes";

export function Leaderboard() {
  if (!isContractAddressConfigured || !isContractAddressValid || !hasContractAddress) {
    return <PreviewLeaderboard />;
  }

  return <LiveLeaderboard />;
}

function LiveLeaderboard() {
  const contractAddress = MONBEAST_CONTRACT_ADDRESS ?? zeroAddress;
  const {
    data: totalBeasts,
    isLoading: totalLoading,
    refetch: refetchTotal
  } = useReadContract({
    address: contractAddress,
    abi: monbeastAbi,
    functionName: "totalBeasts",
    chainId: MONAD_TESTNET_CHAIN_ID
  });

  const ids = useMemo(() => buildLeaderboardIds(totalBeasts), [totalBeasts]);
  const capped = Boolean(totalBeasts && totalBeasts > BigInt(LEADERBOARD_READ_LIMIT));

  const {
    data: reads,
    isLoading: readsLoading,
    refetch: refetchReads
  } = useReadContracts({
    allowFailure: true,
    contracts: ids.flatMap((tokenId) => [
      {
        address: contractAddress,
        abi: monbeastAbi,
        functionName: "getBeast",
        args: [tokenId],
        chainId: MONAD_TESTNET_CHAIN_ID
      },
      {
        address: contractAddress,
        abi: monbeastAbi,
        functionName: "ownerOf",
        args: [tokenId],
        chainId: MONAD_TESTNET_CHAIN_ID
      },
      {
        address: contractAddress,
        abi: monbeastAbi,
        functionName: "locked",
        args: [tokenId],
        chainId: MONAD_TESTNET_CHAIN_ID
      }
    ]),
    query: { enabled: ids.length > 0 }
  });

  const beasts = useMemo(() => {
    const normalized = ids
      .map((tokenId, index) =>
        normalizeBeast(
          reads?.[index * 3]?.result,
          tokenId,
          stringResult(reads?.[index * 3 + 1]?.result),
          Boolean(reads?.[index * 3 + 2]?.result)
        )
      )
      .filter((beast): beast is LeaderboardBeast => Boolean(beast))
      .map((beast) => ({ ...beast, id: String(beast.id) }));

    return sortLeaderboard(normalized);
  }, [ids, reads]);

  const loading = totalLoading || readsLoading;

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-7">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--monad-purple)]">
            Leaderboard
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Champions of the arena.
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            void refetchTotal();
            void refetchReads();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white/55 transition hover:border-[var(--monad-purple)] hover:text-white"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Refresh leaderboard
        </button>
      </div>

      {capped && (
        <p className="mb-5 rounded-2xl border border-[#FBBF24]/25 bg-[#FBBF24]/10 p-4 text-sm font-bold text-[#FDE68A]">
          Showing first {LEADERBOARD_READ_LIMIT} beasts for MVP read safety.
        </p>
      )}

      {loading ? (
        <LeaderboardShell>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </LeaderboardShell>
      ) : beasts.length ? (
        <LeaderboardShell>
          {beasts.map((beast, index) => (
            <LeaderboardRow key={beast.id} beast={beast} rank={index + 1} />
          ))}
        </LeaderboardShell>
      ) : (
        <EmptyState title="No champions yet." description="No beasts minted yet. Create the first fighter." />
      )}
    </section>
  );
}

function PreviewLeaderboard() {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-7">
      <div className="mb-5">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--monad-purple)]">
          Leaderboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
          Preview leaderboard
        </h1>
      </div>

      <div className="mb-5">
        <ContractStatus />
      </div>

      <LeaderboardShell>
        {leaderboardBeasts.map((beast, index) => (
          <LeaderboardRow
            key={beast.id}
            rank={index + 1}
            beast={{
              ...beast,
              id: String(beast.id)
            }}
          />
        ))}
      </LeaderboardShell>
    </section>
  );
}

function LeaderboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/32 backdrop-blur">
      {children}
    </div>
  );
}

function LeaderboardRow({ beast, rank }: { beast: LeaderboardBeast; rank: number }) {
  return (
    <div
      className={cn(
        "grid gap-3 border-b border-white/10 p-3.5 last:border-b-0 md:grid-cols-[56px_1fr_76px_76px_76px_96px] md:items-center",
        rank === 1 && "bg-[#FBBF24]/[0.06]",
        rank === 2 && "bg-white/[0.045]",
        rank === 3 && "bg-[#CD7F32]/[0.06]"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04] text-base font-black",
            rank === 1 && "text-[var(--gold)]",
            rank === 2 && "text-[#CBD5E1]",
            rank === 3 && "text-[#FDBA74]",
            rank > 3 && "text-[var(--text-secondary)]"
          )}
        >
          {rank}
        </span>
        {rank === 1 && <Trophy className="h-5 w-5 text-[var(--gold)]" aria-hidden="true" />}
      </div>
      <BeastMiniCard beast={beast} />
      <span className="text-sm font-bold text-[var(--text-secondary)]">Lvl {beast.level}</span>
      <span className="text-sm font-bold text-[#86EFAC]">{beast.wins} wins</span>
      <span className="text-sm font-bold text-[#FCA5A5]">{beast.losses} losses</span>
      <span
        className={cn(
          "rounded-full border px-3 py-1 text-center text-xs font-black uppercase tracking-[0.14em]",
          beast.locked
            ? "border-[#FBBF24]/25 bg-[#FBBF24]/10 text-[#FDE68A]"
            : "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#86EFAC]"
        )}
      >
        {beast.locked ? "Locked" : "Available"}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid gap-4 border-b border-[var(--border)] p-4 last:border-b-0 md:grid-cols-[74px_1fr_110px_90px_90px_110px] md:items-center">
      <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
      <div className="h-14 rounded-xl bg-white/[0.05]" />
      <div className="h-4 rounded bg-white/[0.05]" />
      <div className="h-4 rounded bg-white/[0.05]" />
      <div className="h-4 rounded bg-white/[0.05]" />
      <div className="h-7 rounded-full bg-white/[0.05]" />
    </div>
  );
}

function stringResult(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
