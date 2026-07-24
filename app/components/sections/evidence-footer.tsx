"use client";

import {
  Coins,
  ExternalLink,
  Factory,
  FileLock2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { EXPLORER_BASE_URL } from "@/app/lib/chain/chain";
import {
  failureDeployment,
  successDeployment,
} from "@/app/lib/chain/deployments";
import {
  CopyValue,
  ExplorerLink,
  SectionHead,
  SourceTag,
  truncateMiddle,
} from "@/app/components/site/primitives";

/**
 * "Evidence & boundaries" — light footer (06).
 * Every checkable artifact (both campaign contracts, the manifest hash and
 * file, verified source) plus an explicit list of what this demo does NOT
 * claim. Static deployment metadata from deployments/injective-testnet.json,
 * so there is no async loading path.
 */

const BOUNDARIES = [
  {
    icon: Coins,
    title: "Testnet INJ has no value",
    body: "Every amount on this page is denominated in test INJ on Injective EVM Testnet. It cannot be sold, swapped, or redeemed.",
  },
  {
    icon: Factory,
    title: "Demo factories are team-controlled wallets",
    body: "Factory North and Factory Loom are wallets operated by the team. Their MOQ quotes are illustrative and were frozen when the campaign opened.",
  },
  {
    icon: Truck,
    title: "Production and logistics are an off-chain demo",
    body: "Nothing after settlement is a commitment. Manufacturing, quality, and delivery are demonstrated, not promised.",
  },
  {
    icon: FileLock2,
    title: "The manifest hash proves one thing only",
    body: "It proves the published spec file has not changed since the campaign opened. It says nothing about demand, quality, or delivery.",
  },
] as const;

function ContractCodeLink({
  address,
  children,
}: {
  address: `0x${string}`;
  children: string;
}) {
  return (
    <a
      href={`${EXPLORER_BASE_URL}/address/${address}?tab=contract`}
      target="_blank"
      rel="noreferrer"
      className="num inline-flex min-h-0 min-w-0 items-center gap-1.5 text-13 text-azure underline-offset-4 transition-colors hover:text-azure-deep hover:underline"
    >
      <span>{children}</span>
      <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
    </a>
  );
}

function ReferenceRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-n-22 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
        {label}
      </dt>
      <dd className="flex flex-wrap items-center gap-x-4 gap-y-1">{children}</dd>
    </div>
  );
}

export function EvidenceFooter() {
  return (
    <div className="surface-flat reveal flex flex-col gap-10 px-5 py-10 sm:px-10 sm:py-12">
      <div className="flex flex-col gap-4">
        <SectionHead
          kicker="06 / Evidence & boundaries"
          title="Everything on this page is checkable"
          intro="The contracts, the manifest, and the settlement transactions are public. Here is exactly where to verify them — and what they do not prove."
        />
        <div className="flex items-center gap-4">
          <SourceTag tone="testnet">Injective EVM Testnet</SourceTag>
          <SourceTag tone="onchain">Onchain</SourceTag>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* on-chain references */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
            On-chain references
          </p>
          <dl>
            <ReferenceRow label="Success campaign">
              <CopyValue value={successDeployment.address} />
              <ExplorerLink address={successDeployment.address}>
                View
              </ExplorerLink>
            </ReferenceRow>
            <ReferenceRow label="Failure campaign">
              <CopyValue value={failureDeployment.address} />
              <ExplorerLink address={failureDeployment.address}>
                View
              </ExplorerLink>
            </ReferenceRow>
            <ReferenceRow label="Manifest hash (both campaigns)">
              <CopyValue value={successDeployment.manifestHash} />
            </ReferenceRow>
            <ReferenceRow label="Manifest file">
              <a
                href={successDeployment.manifestURI}
                target="_blank"
                rel="noreferrer"
                className="num inline-flex min-h-0 min-w-0 items-center gap-1.5 text-13 text-azure underline-offset-4 transition-colors hover:text-azure-deep hover:underline"
              >
                <span>{truncateMiddle(successDeployment.manifestURI, 44, 22)}</span>
                <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
              </a>
            </ReferenceRow>
          </dl>
          <p className="flex flex-wrap items-center gap-2 border-t border-n-22 pt-4 text-13 text-n-64">
            <ShieldCheck size={15} className="shrink-0 text-signal-onchain" aria-hidden="true" />
            <span>Verified source on Blockscout:</span>
            <ContractCodeLink address={successDeployment.address}>
              Success
            </ContractCodeLink>
            <ContractCodeLink address={failureDeployment.address}>
              Failure
            </ContractCodeLink>
          </p>
        </div>

        {/* boundaries */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
            Boundaries
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {BOUNDARIES.map((item) => (
              <li key={item.title} className="flex flex-col gap-1.5">
                <p className="flex items-center gap-2 text-13 font-medium text-n-92">
                  <item.icon size={14} className="shrink-0 text-n-52" aria-hidden="true" />
                  {item.title}
                </p>
                <p className="text-13 leading-relaxed text-n-64">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-n-22 pt-4">
        <p className="font-mono text-11 tracking-[0.06em] text-n-52">
          Hackathon scaled test data — amounts, orders, and quotes are scaled
          down for demonstration.
        </p>
        <p className="font-mono text-11 tracking-[0.06em] text-n-40">
          Injective EVM Testnet · Chain ID 1439 · FRAME-01
        </p>
      </div>
    </div>
  );
}
