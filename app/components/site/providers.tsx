"use client";

import {
  connectorsForWallets,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";
import { http } from "viem";
import { CHAIN_ID, RPC_URL } from "@/app/lib/chain/config";
import { injectiveEvmTestnet } from "@/app/lib/chain/client";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  "makebook-default-project-id";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet],
    },
  ],
  {
    appName: "MAKEBOOK",
    projectId,
  },
);

const config = createConfig({
  chains: [injectiveEvmTestnet],
  transports: {
    [CHAIN_ID]: http(RPC_URL),
  },
  connectors,
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
  accentColor: "#1d4ed8",
  accentColorForeground: "#ffffff",
  borderRadius: "small",
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
