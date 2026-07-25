"use client";

import { useAccount } from "wagmi";
import { useConsoleRole, type ConsoleRole } from "@/app/lib/chain/hooks";
import { ProvenanceTag } from "@/app/components/site/provenance-tag";
import { useCopy } from "@/app/lib/i18n/use-copy";

export function RoleBar() {
  const copy = useCopy();
  const { address, isConnected } = useAccount();
  const { roles, isLoading } = useConsoleRole(address);

  const roleText = (role: ConsoleRole): string =>
    role === "guest"
      ? copy.console.role.guest
      : role === "operator"
        ? copy.console.role.operator
        : role === "factory"
          ? copy.console.role.factory
          : role === "creator"
            ? copy.console.role.creator
            : role === "platform"
              ? copy.console.role.platform
              : copy.console.role.viewer;

  const roleClass = (role: ConsoleRole): string =>
    role === "operator"
      ? "tag-accent"
      : role === "factory"
        ? "tag-success"
        : role === "creator"
          ? "tag-accent"
          : "tag-neutral";

  return (
    <section className="surface p-5 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 text-ink lg:text-h1">
            {copy.console.title}
          </h1>
          <p className="mt-1 text-body text-ink-2">{copy.console.role.subtitle}</p>
          {roles.includes("operator") && (
            <p className="mt-1 text-micro text-ink-3">
              {copy.console.role.operatorNote}
            </p>
          )}
        </div>

        {/* N-10: no second Connect wallet here — the top bar already has one. */}
        {isConnected && !isLoading && (
          <div className="flex flex-wrap items-center gap-3">
            {roles.map((role) => (
              <span key={role} className={`tag ${roleClass(role)}`}>
                {roleText(role)}
              </span>
            ))}
            {roles.includes("factory") && <ProvenanceTag type="DEMO FACTORY" />}
          </div>
        )}
      </div>
    </section>
  );
}
