import { AlertCircle, CheckCircle2, Clock3, ExternalLink, Loader2, Wallet } from "lucide-react";
import { safeExternalLinkProps, shortHash, txUrl } from "@/lib/explorer";
import { cn } from "@/lib/format";

export type TxStatus = "idle" | "wallet" | "pending" | "confirmed" | "failed" | "ready";

type TxChipProps = {
  label?: string;
  hash?: string;
  status?: TxStatus;
  error?: string;
  explorerUrl?: string;
};

const statusStyles = {
  idle: "border-white/10 bg-white/[0.04] text-white/55",
  wallet: "border-[#FBBF24]/35 bg-[#FBBF24]/10 text-[#FDE68A]",
  pending: "border-[#836EF9]/40 bg-[#836EF9]/10 text-[#C4B5FD] animate-pulse",
  confirmed: "border-[#22C55E]/35 bg-[#22C55E]/10 text-[#86EFAC]",
  failed: "border-[#EF4444]/35 bg-[#EF4444]/10 text-[#FCA5A5]",
  ready: "border-[#22C55E]/35 bg-[#22C55E]/10 text-[#86EFAC]"
};

const statusLabels: Record<TxStatus, string> = {
  idle: "Idle",
  wallet: "Waiting for wallet",
  pending: "Pending",
  confirmed: "Confirmed",
  failed: "Failed",
  ready: "Ready"
};

const statusIcons = {
  idle: Clock3,
  wallet: Wallet,
  pending: Loader2,
  confirmed: CheckCircle2,
  failed: AlertCircle,
  ready: CheckCircle2
};

export function TxChip({
  label,
  hash,
  status = "idle",
  error,
  explorerUrl
}: TxChipProps) {
  const Icon = statusIcons[status];
  const url = explorerUrl ?? (hash ? txUrl(hash) : undefined);
  const text = label ?? (hash ? shortHash(hash) : statusLabels[status]);

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
        statusStyles[status]
      )}
      title={error}
    >
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", status === "pending" && "animate-spin")}
        aria-hidden="true"
      />
      <span className="truncate">{text}</span>
      {url && (
        <a
          href={url}
          {...safeExternalLinkProps}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-current transition hover:bg-white/10"
          aria-label="Open transaction in explorer"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
