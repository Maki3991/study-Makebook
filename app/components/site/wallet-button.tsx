"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CHAIN_ID } from "@/app/lib/chain/config";
import { copy } from "@/app/lib/copy";
import { truncateAddress } from "@/app/lib/chain/format";

export function WalletButton() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const isWrongNetwork = chainId !== CHAIN_ID;

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
              <button
                type="button"
                onClick={openConnectModal}
                className="btn btn-primary px-4 text-sm"
              >
                {copy.global.wallet.connect}
              </button>
            ) : isWrongNetwork ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => switchChain?.({ chainId: CHAIN_ID })}
                className="btn btn-danger px-4 text-sm"
              >
                {isPending
                  ? copy.global.wallet.switching
                  : copy.global.wallet.wrongNetwork}
              </button>
            ) : (
              <button
                type="button"
                onClick={openAccountModal}
                className="btn btn-secondary px-4 text-sm"
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
