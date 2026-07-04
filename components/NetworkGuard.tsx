"use client";

import { AlertTriangle, CheckCircle2, Loader2, RadioTower } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { MONAD_RPC_URL, MONAD_TESTNET_CHAIN_ID, isMonadTestnet } from "@/lib/monad";
import { cn } from "@/lib/format";

type NetworkGuardProps = {
  compact?: boolean;
};

export function NetworkGuard({ compact = false }: NetworkGuardProps) {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, error } = useSwitchChain();
  const onMonad = isMonadTestnet(chainId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-black/20 p-4 text-sm text-[var(--text-muted)]">
        Checking wallet network...
      </section>
    );
  }

  if (!isConnected) {
    return (
      <GuardShell
        compact={compact}
        icon={<RadioTower className="h-5 w-5" aria-hidden="true" />}
        tone="idle"
        title="Wallet optional"
        description="Browse the mock arena now. Connect wallet to play in the next transaction sections."
      />
    );
  }

  if (onMonad) {
    return (
      <GuardShell
        compact={compact}
        icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
        tone="success"
        title="Monad Testnet connected"
        description="Wallet is on chain 10143 with native MON."
      />
    );
  }

  return (
    <GuardShell
      compact={compact}
      icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
      tone="warning"
      title="Switch to Monad Testnet"
      description={`Current chain: ${chainId}. MonBeast Arena uses Monad Testnet (${MONAD_TESTNET_CHAIN_ID}).`}
      action={
        <button
          type="button"
          onClick={() => switchChain({ chainId: MONAD_TESTNET_CHAIN_ID })}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--monad-purple)] px-4 text-sm font-black text-white transition hover:bg-[var(--purple-hover)]"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Switch network
        </button>
      }
      footer={
        error && (
          <div className="mt-3 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/10 p-3 text-xs leading-5 text-[#FDE68A]">
            <p className="font-bold">Manual details</p>
            <p>Network: Monad Testnet</p>
            <p>Chain ID: {MONAD_TESTNET_CHAIN_ID}</p>
            <p>Currency: MON</p>
            <p className="break-all">RPC: {MONAD_RPC_URL}</p>
          </div>
        )
      }
    />
  );
}

function GuardShell({
  compact,
  icon,
  tone,
  title,
  description,
  action,
  footer
}: {
  compact: boolean;
  icon: ReactNode;
  tone: "idle" | "success" | "warning";
  title: string;
  description: string;
  action?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-black/20",
        compact ? "p-4" : "p-5",
        tone === "success" && "border-[#22C55E]/25",
        tone === "warning" && "border-[#FBBF24]/30",
        tone === "idle" && "border-[var(--border)]"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              tone === "success" && "bg-[#22C55E]/10 text-[#86EFAC]",
              tone === "warning" && "bg-[#FBBF24]/10 text-[#FDE68A]",
              tone === "idle" && "bg-white/[0.05] text-[var(--text-secondary)]"
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--text-primary)]">
              {title}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {footer}
    </section>
  );
}
