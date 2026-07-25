"use client";

import { useState } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CHAIN_ID } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { truncateAddress } from "@/app/lib/chain/format";

const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";

export function WalletButton() {
  const copy = useCopy();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const isWrongNetwork = chainId !== CHAIN_ID;
  // This subtree is client-only (ProvidersShell is ssr:false), so reading
  // window.ethereum during the first render is safe and avoids a flash.
  // Spec 009 §5-11: with only the injected metaMask connector left, a browser
  // without an injected provider would get an empty wallet list — point the
  // user at the MetaMask install page instead.
  const [hasInjectedProvider] = useState(
    () => typeof window !== "undefined" && Boolean(window.ethereum),
  );

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            aria-hidden={!ready}
            style={{
              opacity: ready ? 1 : 0,
              pointerEvents: ready ? "auto" : "none",
              transition: "opacity 150ms ease-out",
            }}
          >
            {!connected ? (
              hasInjectedProvider ? (
                <button
                  type="button"
                  onClick={openConnectModal}
                  // §5.1: aria-hidden until ready — keep it out of the tab
                  // order too, otherwise the hidden button stays focusable.
                  tabIndex={ready ? undefined : -1}
                  className="btn btn-primary whitespace-nowrap px-4 text-body"
                >
                  {copy.global.wallet.connect}
                </button>
              ) : (
                <a
                  href={METAMASK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={ready ? undefined : -1}
                  className="btn btn-primary whitespace-nowrap px-4 text-body"
                >
                  {copy.global.wallet.installMetaMask}
                </a>
              )
            ) : isWrongNetwork ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => switchChain?.({ chainId: CHAIN_ID })}
                tabIndex={ready ? undefined : -1}
                className="btn btn-danger whitespace-nowrap px-4 text-body"
              >
                {isPending
                  ? copy.global.wallet.switching
                  : copy.global.wallet.wrongNetwork}
              </button>
            ) : (
              <button
                type="button"
                onClick={openAccountModal}
                tabIndex={ready ? undefined : -1}
                className="btn btn-secondary whitespace-nowrap px-4 text-body"
              >
                {truncateAddress(account.address)}
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
