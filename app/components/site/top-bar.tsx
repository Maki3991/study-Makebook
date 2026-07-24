"use client";

import Image from "next/image";
import { useState } from "react";
import { shortenAddress } from "@/app/lib/chain/wallet";
import { Button, CopyValue, SourceTag } from "./primitives";
import { useSiteWallet } from "./wallet-provider";

/**
 * Site top bar: brand lockup (monogram on small screens, wordmark from sm up)
 * + "FRAME-01 Campaign" label left; TESTNET pill + wallet control right.
 *
 * Both brand PNGs ship with generous padding, so each is rendered with
 * object-fit: cover inside an aspect-ratio box that matches the measured
 * content bounding box (monogram ≈ 2.609, wordmark ≈ 4.649).
 */
export function TopBar() {
  const {
    address,
    connected,
    connecting,
    connect,
    switchNetwork,
    isWrongNetwork,
  } = useSiteWallet();
  const [switching, setSwitching] = useState(false);

  const onConnect = async () => {
    try {
      await connect();
    } catch {
      // User rejected the auth prompt — stay in the idle state.
    }
  };

  const onSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await switchNetwork();
    } catch {
      // User rejected the switch — the wrong-network state stays visible.
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-n-22 bg-n-00">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="relative block h-7 shrink-0 sm:hidden"
            style={{ aspectRatio: "2.609" }}
          >
            <Image
              src="/makebook-monogram.png"
              alt="MAKEBOOK"
              fill
              sizes="73px"
              priority
              // The vinext dev worker has no ASSETS binding, so the
              // /_vinext/image optimizer 500s; serve the file directly.
              unoptimized
              style={{ objectFit: "cover", objectPosition: "50% 49.9%" }}
            />
          </span>
          <span
            className="relative hidden h-[18px] shrink-0 sm:block"
            style={{ aspectRatio: "4.649" }}
          >
            <Image
              src="/makebook-wordmark.png"
              alt="MAKEBOOK"
              fill
              sizes="84px"
              priority
              // See monogram above: bypass the broken dev image optimizer.
              unoptimized
              style={{ objectFit: "cover", objectPosition: "50% 47.4%" }}
            />
          </span>
          <span className="line-v hidden h-5 sm:block" aria-hidden="true" />
          <span className="hidden truncate font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-64 sm:block">
            FRAME-01 Campaign
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="pill hidden sm:inline-flex">
            <SourceTag tone="testnet">Testnet</SourceTag>
          </span>
          {!connected ? (
            <Button
              variant="primary"
              state={connecting ? "loading" : "idle"}
              onClick={onConnect}
            >
              Connect Wallet
            </Button>
          ) : isWrongNetwork ? (
            <Button
              variant="primary"
              className="btn-danger"
              state={switching ? "loading" : "error"}
              onClick={onSwitchNetwork}
            >
              Wrong Network
            </Button>
          ) : (
            <CopyValue
              value={address ?? ""}
              display={address ? shortenAddress(address) : ""}
              className="min-h-[36px] rounded-sm border border-n-22 bg-n-04 px-3"
            />
          )}
        </div>
      </div>
    </header>
  );
}
