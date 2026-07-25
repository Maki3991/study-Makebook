"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { Wallet } from "lucide-react";
import { OrderCard } from "@/app/components/orders/order-card";
import { WalletButton } from "@/app/components/site/wallet-button";
import { DEPLOYED_CAMPAIGNS } from "@/app/lib/chain/config";
import { useMyOrder } from "@/app/lib/chain/hooks";
import { useCopy } from "@/app/lib/i18n/use-copy";

function ConnectEmptyState() {
  const copy = useCopy();

  return (
    <div className="surface flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Wallet size={24} />
      </div>
      <h2 className="mt-5 text-base font-semibold text-ink">
        {copy.orders.empty.connect}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-ink-2">
        {copy.orders.empty.connectBody}
      </p>
      <div className="mt-5">
        <WalletButton />
      </div>
    </div>
  );
}

function NoOrdersState() {
  const copy = useCopy();

  return (
    <div className="surface flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-base font-semibold text-ink">
        {copy.orders.empty.none}
      </h2>
      <Link
        href="/"
        className="btn btn-primary mt-5 inline-flex"
      >
        {copy.home.hero.cta}
      </Link>
    </div>
  );
}

export default function OrdersPage() {
  const copy = useCopy();
  const { address, isConnected } = useAccount();

  // Call hooks for every possible campaign in fixed order to obey Rules of Hooks.
  const myOrderSuccess = useMyOrder("success", address);
  const myOrderFailure = useMyOrder("failure", address);
  const myOrderBracelet = useMyOrder("bracelet", address);

  const orderMap = {
    success: myOrderSuccess,
    failure: myOrderFailure,
    bracelet: myOrderBracelet,
  };

  const hasAnyOrder = DEPLOYED_CAMPAIGNS.some((id) => orderMap[id].data);

  return (
    <main className="page py-10 lg:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 font-semibold leading-tight text-ink lg:text-h1">
            {copy.global.nav.orders}
          </h1>
          <p className="mt-1 text-sm text-ink-2">{copy.orders.subtitle}</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {!isConnected ? (
          <ConnectEmptyState />
        ) : !hasAnyOrder ? (
          <NoOrdersState />
        ) : (
          DEPLOYED_CAMPAIGNS.map((id) => <OrderCard key={id} id={id} />)
        )}
      </div>
    </main>
  );
}
