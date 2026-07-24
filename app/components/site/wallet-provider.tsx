"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Address } from "viem";
import { INJECTIVE_EVM_TESTNET_CHAIN_ID } from "@/app/lib/chain/chain";
import { switchToInjectiveNetwork, useWallet } from "@/app/lib/chain/wallet";

/**
 * Site-wide wallet context: wraps app/lib/chain/wallet.ts `useWallet`
 * (silent session restore + accountsChanged/chainChanged listeners are
 * handled inside the lib hook) and exposes a flat, component-friendly value.
 */
export interface SiteWalletValue {
  /** Connected account, null while disconnected. */
  address: Address | null;
  /** EIP-155 chain id of the wallet's current network, null while disconnected. */
  chainId: number | null;
  connected: boolean;
  /** eth_requestAccounts in flight. */
  connecting: boolean;
  /** Triggers the wallet auth prompt. Rejection propagates — catch at the call site. */
  connect: () => Promise<void>;
  /** wallet_switchEthereumChain → Injective EVM Testnet (adds the chain on 4902). */
  switchNetwork: () => Promise<void>;
  /** Connected but on a chain other than Injective EVM Testnet (1439). */
  isWrongNetwork: boolean;
}

const SiteWalletContext = createContext<SiteWalletValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { wallet, connecting, connect } = useWallet();

  const switchNetwork = useCallback(async () => {
    await switchToInjectiveNetwork();
  }, []);

  const value = useMemo<SiteWalletValue>(
    () => ({
      address: wallet?.address ?? null,
      chainId: wallet?.chainId ?? null,
      connected: wallet !== null,
      connecting,
      connect,
      switchNetwork,
      isWrongNetwork:
        wallet !== null && wallet.chainId !== INJECTIVE_EVM_TESTNET_CHAIN_ID,
    }),
    [wallet, connecting, connect, switchNetwork],
  );

  return (
    <SiteWalletContext.Provider value={value}>
      {children}
    </SiteWalletContext.Provider>
  );
}

/** Access the site wallet. Must be rendered under <WalletProvider>. */
export function useSiteWallet(): SiteWalletValue {
  const ctx = useContext(SiteWalletContext);
  if (!ctx) {
    throw new Error("useSiteWallet must be used within <WalletProvider>");
  }
  return ctx;
}
