"use client";

import { AlertTriangle, ChevronDown, Loader2, LogOut, RefreshCcw, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAccount, useBalance, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { addressUrl, formatMon, safeExternalLinkProps, shortAddress } from "@/lib/explorer";
import { cn } from "@/lib/format";
import { MONAD_RPC_URL, MONAD_TESTNET_CHAIN_ID, isMonadTestnet } from "@/lib/monad";

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasInjectedWallet, setHasInjectedWallet] = useState(true);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
  const onMonad = isMonadTestnet(chainId);
  const connector = useMemo(
    () =>
      connectors.find((item) => item.id === "injected" || item.name.toLowerCase().includes("meta"))
      ?? connectors[0],
    [connectors]
  );

  const { data: balance } = useBalance({
    address,
    chainId: MONAD_TESTNET_CHAIN_ID,
    query: {
      enabled: mounted && Boolean(address) && onMonad
    }
  });

  useEffect(() => {
    setMounted(true);
    setHasInjectedWallet(
      typeof window !== "undefined" &&
        Boolean((window as Window & { ethereum?: unknown }).ethereum)
    );
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-40 rounded-xl border border-[var(--border-strong)] bg-white/[0.04]" />
    );
  }

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (hasInjectedWallet && connector) {
              connect({ connector });
            }
            setOpen(true);
          }}
          disabled={isConnecting || !connector}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white/[0.04] px-3.5 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--monad-purple)] hover:bg-[rgba(131,110,249,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--gold)]" aria-hidden="true" />
          ) : (
            <Wallet className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
          )}
          Connect wallet
        </button>
        {(open || connectError) && (
          <WalletPopover>
            {!hasInjectedWallet ? (
              <StatusMessage
                tone="warning"
                title="Injected wallet not found"
                detail="Install MetaMask or another injected wallet to connect."
              />
            ) : connectError ? (
              <StatusMessage tone="warning" title="Connection failed" detail={connectError.message} />
            ) : (
              <StatusMessage
                tone="idle"
                title="Wallet required for transactions"
                detail="The mock arena stays open. Section 7 will use this connection for minting."
              />
            )}
          </WalletPopover>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex min-h-9 max-w-full items-center justify-center gap-2 rounded-xl border bg-white/[0.04] px-3 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--monad-purple)] hover:bg-[rgba(131,110,249,0.12)]",
          onMonad ? "border-[#22C55E]/35" : "border-[#FBBF24]/45"
        )}
      >
        <Wallet className="h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden="true" />
        <span className="truncate">{shortAddress(address)}</span>
        <span className="hidden text-[var(--text-muted)] sm:inline">
          {onMonad ? formatMon(balance?.value) : "Wrong network"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
      </button>

      {open && (
        <WalletPopover>
          <div className="space-y-3">
            <StatusMessage
              tone={onMonad ? "success" : "warning"}
              title={onMonad ? "Monad Testnet connected" : "Wrong network"}
              detail={onMonad ? `Balance: ${formatMon(balance?.value)}` : `Current chain: ${chainId}`}
            />

            {address && (
              <a
                href={addressUrl(address)}
                {...safeExternalLinkProps}
                className="block truncate rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-bold text-[var(--text-secondary)] transition hover:text-white"
              >
                {shortAddress(address)}
              </a>
            )}

            {!onMonad && (
              <div>
                <button
                  type="button"
                  onClick={() => switchChain({ chainId: MONAD_TESTNET_CHAIN_ID })}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--monad-purple)] px-4 text-sm font-black text-white transition hover:bg-[var(--purple-hover)]"
                >
                  {isSwitching ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  )}
                  Switch to Monad
                </button>
                {switchError && (
                  <div className="mt-3 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/10 p-3 text-xs leading-5 text-[#FDE68A]">
                    <p className="font-bold">Manual network details</p>
                    <p>Chain ID: {MONAD_TESTNET_CHAIN_ID}</p>
                    <p>Symbol: MON</p>
                    <p className="break-all">RPC: {MONAD_RPC_URL}</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-[var(--text-secondary)] transition hover:border-[#EF4444]/40 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Disconnect
            </button>
          </div>
        </WalletPopover>
      )}
    </div>
  );
}

function WalletPopover({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[rgba(11,8,18,0.98)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      {children}
    </div>
  );
}

function StatusMessage({
  tone,
  title,
  detail
}: {
  tone: "idle" | "success" | "warning";
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl",
          tone === "success" && "bg-[#22C55E]/10 text-[#86EFAC]",
          tone === "warning" && "bg-[#FBBF24]/10 text-[#FDE68A]",
          tone === "idle" && "bg-white/[0.05] text-[var(--text-secondary)]"
        )}
      >
        {tone === "warning" ? (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Wallet className="h-4 w-4" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--text-primary)]">
          {title}
        </p>
        <p className="mt-1 break-words text-sm leading-6 text-[var(--text-muted)]">{detail}</p>
      </div>
    </div>
  );
}
