import { parseEther } from "viem";

export const MINT_FEE_MON = "0.02";
export const MINT_FEE_WEI = parseEther(MINT_FEE_MON);

export function formatWalletError(error: unknown) {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("user rejected") || normalized.includes("user denied")) {
    return "Transaction rejected in wallet.";
  }
  if (normalized.includes("insufficient funds")) {
    return "Not enough MON for gas.";
  }
  if (normalized.includes("wrong network") || normalized.includes("chain mismatch")) {
    return "Switch to Monad Testnet.";
  }
  if (normalized.includes("beastlocked")) {
    return "This beast is already locked in a challenge.";
  }
  if (normalized.includes("notbeastowner")) {
    return "You do not own this beast.";
  }
  if (normalized.includes("challengenotopen")) {
    return "This challenge is no longer open.";
  }
  if (normalized.includes("selfbattle")) {
    return "A beast cannot fight itself.";
  }
  if (normalized.includes("contract address")) {
    return "Add NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS in .env.local, then restart the dev server.";
  }
  if (normalized.includes("execution reverted") || normalized.includes("reverted")) {
    return "Contract reverted the transaction.";
  }

  return message || "Unknown wallet error.";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error && "shortMessage" in error) {
    const value = (error as { shortMessage?: unknown }).shortMessage;
    return typeof value === "string" ? value : "";
  }
  if (typeof error === "string") {
    return error;
  }

  return "";
}
