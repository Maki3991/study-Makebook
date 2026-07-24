import { createPublicClient, defineChain, http } from "viem";
import { CHAIN_ID, RPC_URL } from "./config";

export const injectiveEvmTestnet = defineChain({
  id: CHAIN_ID,
  name: "Injective EVM Testnet",
  nativeCurrency: { name: "INJ", symbol: "INJ", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://testnet.blockscout.injective.network",
    },
  },
  testnet: true,
});

export const publicClient = createPublicClient({
  chain: injectiveEvmTestnet,
  transport: http(RPC_URL),
});
