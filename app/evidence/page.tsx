import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Hex } from "viem";
import {
  CopyValue,
  ExplorerLink,
  SourceTag,
} from "@/app/components/site/primitives";
import { TopBar } from "@/app/components/site/top-bar";
import {
  deployments,
  isZeroAddress,
  type CampaignDeployment,
} from "@/app/lib/chain/deployments";
import { LiveStateChip, PlaygroundLiveChip } from "./live-state";
import { receiptEntries, type ReceiptEntry } from "./receipts-data";

/** "0x12345678…abcdef" 中段截断（与 primitives.truncateMiddle 同规则；
 * primitives 是 client 模块，纯函数不能在 RSC 侧调用，本地复制一份。 */
function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export const metadata: Metadata = {
  title: "Evidence — MAKEBOOK",
  description:
    "Every deployed FRAME-01 campaign and every ops transaction, deep-linked to the Injective testnet explorer.",
};

/**
 * /evidence — 证据页（RSC）。
 * - 合约卡：deployments/injective-testnet.json 元数据（地址/manifestHash/deadline）
 *   + 每张卡挂实时状态行（client chip：useCampaignData / playground RPC 直读）
 * - receipts 表：deployments/receipts/**\/*.jsonl 构建期内联解析，testnet 行
 *   深链 Blockscout；anvil 本地排练行只展示不链接（浏览器explorer 查不到）
 * - playground 缺失或零地址时显示虚线占位卡，绝不伪造地址
 */

const playgroundDeployment = (deployments as { playground?: CampaignDeployment })
  .playground;
const hasPlayground = Boolean(
  playgroundDeployment && !isZeroAddress(playgroundDeployment.address),
);

interface CampaignCardData {
  key: "success" | "failure" | "playground";
  label: string;
  note: string;
  deployment: CampaignDeployment;
}

const campaigns: CampaignCardData[] = [
  {
    key: "success",
    label: "Success campaign",
    note: "Scripted demo — the batch clears and winners claim the difference.",
    deployment: deployments.success,
  },
  {
    key: "failure",
    label: "Failure campaign",
    note: "Scripted demo — no tier reaches its MOQ, everyone claims a full refund.",
    deployment: deployments.failure,
  },
  ...(hasPlayground && playgroundDeployment
    ? [
        {
          key: "playground" as const,
          label: "Playground campaign",
          note: "Open instance — any visitor can back this batch.",
          deployment: playgroundDeployment,
        },
      ]
    : []),
];

function formatDeadlineUtc(deadlineSeconds: number): string {
  const text = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(deadlineSeconds * 1000));
  return `${text} UTC`;
}

function formatReceiptTime(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export default function EvidencePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-14 py-10 lg:py-16">
          <header className="flex flex-col gap-3">
            <p className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
              Evidence
            </p>
            <h1 className="font-display text-28 leading-[1.25] font-medium text-n-92">
              Everything verifies onchain
            </h1>
            <p className="max-w-[640px] text-15 leading-relaxed text-n-64">
              The deployed FRAME-01 campaigns, their live state, and every
              transaction the ops CLI ran — each testnet hash deep-links to
              Blockscout.
            </p>
          </header>

          <section className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.key} campaign={campaign} />
              ))}
              {!hasPlayground ? (
                <article className="flex flex-col gap-3 rounded-[2px] border border-dashed border-n-30 p-5">
                  <h3 className="font-display text-17 font-medium text-n-40">
                    Playground campaign
                  </h3>
                  <p className="text-13 leading-relaxed text-n-40">
                    Deployment in progress — once the open instance address
                    lands in deployments/injective-testnet.json, this card goes
                    live with its own contract details.
                  </p>
                </article>
              ) : null}
            </div>
            <p className="font-mono text-11 tracking-[0.06em] text-n-40">
              Deployment metadata: deployments/injective-testnet.json · Live
              state: chain RPC reads
            </p>
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="font-display text-21 font-medium text-n-92">
                  Transaction receipts
                </h2>
                <SourceTag tone="onchain">Onchain</SourceTag>
                <SourceTag tone="testnet">Testnet</SourceTag>
              </div>
              <p className="max-w-[640px] text-13 leading-relaxed text-n-64">
                Receipt logs are written by the ops CLI as batches run
                (deployments/receipts/*.jsonl). Testnet rows deep-link to
                Blockscout; local anvil rehearsal rows are shown without links
                — the explorer never saw them.
              </p>
            </div>
            <ReceiptsTable entries={receiptEntries} />
          </section>

          <p className="font-mono text-11 tracking-[0.06em] text-n-40">
            Hackathon scaled test data · Testnet INJ has no value.
          </p>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 合约卡
// ---------------------------------------------------------------------------

function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
  const { deployment } = campaign;
  return (
    <article className="surface flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-17 font-medium text-n-92">
          {campaign.label}
        </h3>
        <SourceTag tone="testnet">Testnet</SourceTag>
      </div>
      <p className="text-13 leading-relaxed text-n-64">{campaign.note}</p>
      <dl className="flex flex-col gap-3 border-t border-n-22 pt-4">
        <MetaRow label="Contract">
          <span className="flex flex-wrap items-center gap-3">
            <CopyValue value={deployment.address} />
            <ExplorerLink address={deployment.address}>
              Blockscout
            </ExplorerLink>
          </span>
        </MetaRow>
        <MetaRow label="Manifest hash">
          <CopyValue value={deployment.manifestHash} />
        </MetaRow>
        <MetaRow label="Deadline">
          <span className="num text-13 text-n-64">
            {formatDeadlineUtc(deployment.deadline)}
          </span>
        </MetaRow>
        <MetaRow label="Live state">
          {campaign.key === "playground" ? (
            <PlaygroundLiveChip address={deployment.address} />
          ) : (
            <LiveStateChip scenario={campaign.key} />
          )}
        </MetaRow>
      </dl>
    </article>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <dt className="shrink-0 font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// receipts 表
// ---------------------------------------------------------------------------

const RECEIPT_COLUMNS = [
  "Time (UTC)",
  "Campaign",
  "Action",
  "Actor",
  "Network",
  "Transaction",
] as const;

function ReceiptsTable({ entries }: { entries: ReceiptEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="surface-flat p-6 text-15 text-n-64">
        No receipts yet — the ops CLI appends one line per transaction as
        batches run.
      </div>
    );
  }
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-n-22">
            {RECEIPT_COLUMNS.map((column) => (
              <th
                key={column}
                className="px-4 py-3 font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={`${entry.txHash}-${entry.action}`}
              className="border-b border-n-22 last:border-0"
            >
              <td className="num whitespace-nowrap px-4 py-2.5 text-13 text-n-64">
                {formatReceiptTime(entry.ts)}
              </td>
              <td className="px-4 py-2.5 text-13 text-n-92">
                {entry.campaign}
              </td>
              <td
                className="max-w-[280px] break-all px-4 py-2.5 font-mono text-13 text-n-64"
                title={entry.action}
              >
                {entry.action}
              </td>
              <td className="px-4 py-2.5 text-13 text-n-64">{entry.actor}</td>
              <td className="px-4 py-2.5 text-13 text-n-64">
                {entry.network === "testnet" ? "testnet" : "local anvil"}
              </td>
              <td className="px-4 py-2.5">
                {entry.network === "testnet" ? (
                  <ExplorerLink tx={entry.txHash as Hex}>
                    {truncateMiddle(entry.txHash)}
                  </ExplorerLink>
                ) : (
                  <span
                    className="num text-13 text-n-40"
                    title={entry.txHash}
                  >
                    {truncateMiddle(entry.txHash)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
