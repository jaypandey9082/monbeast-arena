import { formatEther } from "viem";
import { getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/monad";

export const safeExternalLinkProps = {
  target: "_blank",
  rel: "noreferrer"
} as const;

export function shortAddress(address?: string) {
  if (!address) {
    return "";
  }

  return address.length <= 12 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function shortHash(hash?: string) {
  if (!hash) {
    return "";
  }

  return hash.length <= 14 ? hash : `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function txUrl(hash: string) {
  return getExplorerTxUrl(hash);
}

export function addressUrl(address: string) {
  return getExplorerAddressUrl(address);
}

export function formatMon(value?: bigint) {
  if (value === undefined) {
    return "0 MON";
  }

  const amount = Number(formatEther(value));

  if (amount === 0) {
    return "0 MON";
  }

  return `${amount.toLocaleString("en-US", {
    maximumFractionDigits: amount < 1 ? 4 : 3
  })} MON`;
}
