import { ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { MONBEAST_CONTRACT_ADDRESS } from "@/lib/contract";
import { addressUrl, safeExternalLinkProps, shortAddress, txUrl } from "@/lib/explorer";
import { formatTokenId } from "@/lib/format";

type TransferProofProps = {
  txHash?: string;
  winnerAddress?: string;
  loserTokenId?: string;
};

export function TransferProof({ txHash, winnerAddress, loserTokenId }: TransferProofProps) {
  return (
    <div className="rounded-2xl border border-[rgba(131,110,249,0.26)] bg-[rgba(131,110,249,0.08)] p-4">
      <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--monad-purple)]">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        ERC-721 ownership transfer
      </div>

      <div className="grid gap-3 text-sm text-[var(--text-secondary)]">
        <ProofRow label="Contract" value={shortAddress(MONBEAST_CONTRACT_ADDRESS)} href={MONBEAST_CONTRACT_ADDRESS ? addressUrl(MONBEAST_CONTRACT_ADDRESS) : undefined} />
        <ProofRow label="Transaction" value={txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-6)}` : "Confirmed transaction"} href={txHash ? txUrl(txHash) : undefined} />
        <ProofRow label="Loser NFT" value={loserTokenId ? formatTokenId(loserTokenId) : "Ownership updated"} />
        <ProofRow label="New owner" value={winnerAddress ? shortAddress(winnerAddress) : "Refresh ownership to verify"} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/10 p-3 text-sm font-bold text-[#86EFAC]">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
        {loserTokenId && winnerAddress
          ? `NFT ${formatTokenId(loserTokenId)} is now owned by ${shortAddress(winnerAddress)}.`
          : "Confirmed transaction. Refresh ownership to verify."}
      </div>
    </div>
  );
}

function ProofRow({ label, value, href }: { label: string; value?: string; href?: string }) {
  const content = value || "Not available";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          {...safeExternalLinkProps}
          className="inline-flex min-w-0 items-center gap-2 truncate font-bold text-[var(--text-primary)] transition hover:text-[var(--gold)]"
        >
          <span className="truncate">{content}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </a>
      ) : (
        <span className="truncate font-bold text-[var(--text-primary)]">{content}</span>
      )}
    </div>
  );
}
