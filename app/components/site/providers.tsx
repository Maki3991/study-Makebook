"use client";

import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";
import { http } from "viem";
import { injected } from "wagmi/connectors";
import { CHAIN_ID, RPC_URL } from "@/app/lib/chain/config";
import { injectiveEvmTestnet } from "@/app/lib/chain/client";

const config = createConfig({
  chains: [injectiveEvmTestnet],
  transports: {
    [CHAIN_ID]: http(RPC_URL),
  },
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: true,
    },
  },
});

const theme = lightTheme({
  accentColor: "#B23A18",
  accentColorForeground: "#FCFBF9",
  borderRadius: "none",
  fontStack: "system",
  overlayBlur: "none",
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" theme={theme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
