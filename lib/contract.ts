import { isAddress, type Address } from "viem";
import { monbeastAbi } from "@/lib/monbeastAbi";
import { monadTestnet } from "@/lib/monad";

export const RAW_MONBEAST_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS?.trim() ?? "";

export const isContractAddressConfigured = RAW_MONBEAST_CONTRACT_ADDRESS.length > 0;
export const isContractAddressValid =
  isContractAddressConfigured && isAddress(RAW_MONBEAST_CONTRACT_ADDRESS);

export const MONBEAST_CONTRACT_ADDRESS = isContractAddressValid
  ? (RAW_MONBEAST_CONTRACT_ADDRESS as Address)
  : undefined;

export const hasContractAddress = Boolean(MONBEAST_CONTRACT_ADDRESS);

export { monbeastAbi };

export const monbeastContractConfig = hasContractAddress
  ? {
      address: MONBEAST_CONTRACT_ADDRESS,
      abi: monbeastAbi,
      chainId: monadTestnet.id
    }
  : undefined;
