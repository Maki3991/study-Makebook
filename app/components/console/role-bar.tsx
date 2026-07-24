"use client";

import { useAccount } from "wagmi";
import { useConsoleRole } from "@/app/lib/chain/hooks";
import { WalletButton } from "@/app/components/site/wallet-button";
import { copy } from "@/app/lib/copy";

export function RoleBar() {
  const { address, isConnected } = useAccount();
  const { role, isLoading } = useConsoleRole(address);

  const roleText =
    role === "guest"
      ? copy.console.role.guest
      : role === "operator"
        ? copy.console.role.operator
        : role === "factory"
          ? copy.console.role.factory
          : copy.console.role.viewer;

  const roleClass =
    role === "operator"
      ? "tag-accent"
      : role === "factory"
        ? "tag-success"
        : "tag-neutral";

  return (
    <section className="surface p-5 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight text-ink lg:text-[30px]">
            {copy.console.title}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Compile demand, monitor batches, and manage factory receivables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && !isLoading && (
            <span className={`tag ${roleClass}`}>{roleText}</span>
          )}
          <WalletButton />
        </div>
      </div>
    </section>
  );
}
