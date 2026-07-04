import { defineChain } from "viem";

export const MONAD_TESTNET_CHAIN_ID = 10143 as const;
export const MONAD_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
export const MONAD_EXPLORER_URL = (
  process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || "https://testnet.monadvision.com"
).replace(/\/$/, "");

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [MONAD_RPC_URL]
    },
    public: {
      http: [MONAD_RPC_URL]
    }
  },
  blockExplorers: {
    default: {
      name: "MonadVision",
      url: MONAD_EXPLORER_URL
    }
  },
  testnet: true
});

export function isMonadTestnet(chainId?: number) {
  return chainId === MONAD_TESTNET_CHAIN_ID;
}

export function getExplorerTxUrl(hash: string) {
  return `${MONAD_EXPLORER_URL}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string) {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}

export function getExplorerTokenUrl(address: string, tokenId?: number | string) {
  const baseUrl = `${MONAD_EXPLORER_URL}/token/${address}`;

  return tokenId === undefined ? baseUrl : `${baseUrl}?a=${tokenId}`;
}
