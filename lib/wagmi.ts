import { createConfig, http, injected } from "wagmi";
import { monadTestnet, MONAD_RPC_URL } from "@/lib/monad";

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(MONAD_RPC_URL)
  },
  ssr: true
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
