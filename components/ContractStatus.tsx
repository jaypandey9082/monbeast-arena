import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import {
  isContractAddressConfigured,
  isContractAddressValid,
  MONBEAST_CONTRACT_ADDRESS,
  RAW_MONBEAST_CONTRACT_ADDRESS
} from "@/lib/contract";
import { addressUrl, safeExternalLinkProps, shortAddress } from "@/lib/explorer";
import { cn } from "@/lib/format";

export function ContractStatus() {
  const contractAddress = MONBEAST_CONTRACT_ADDRESS;
  const valid = isContractAddressValid && Boolean(contractAddress);
  const Icon = valid ? CheckCircle2 : AlertTriangle;

  const title = valid
    ? "Ready for contract actions"
    : isContractAddressConfigured
      ? "Invalid contract address"
      : "Contract address required";

  const detail = valid
    ? shortAddress(contractAddress)
    : isContractAddressConfigured
      ? RAW_MONBEAST_CONTRACT_ADDRESS
      : "Set NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS in .env.local after deployment.";

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-[var(--panel)] p-4 sm:flex-row sm:items-center sm:justify-between",
        valid
          ? "border-[#22C55E]/25"
          : isContractAddressConfigured
            ? "border-[#EF4444]/30"
            : "border-[var(--border)]"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            valid ? "bg-[#22C55E]/10 text-[#86EFAC]" : "bg-[#FBBF24]/10 text-[#FDE68A]"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--text-primary)]">
            {title}
          </p>
          <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{detail}</p>
        </div>
      </div>

      {valid && contractAddress && (
        <a
          href={addressUrl(contractAddress)}
          {...safeExternalLinkProps}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-[var(--text-secondary)] transition hover:border-[var(--monad-purple)] hover:text-white"
        >
          Explorer
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </section>
  );
}
