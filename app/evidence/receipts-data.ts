/// <reference types="vite/client" />

/**
 * 证据页 receipts 数据源（服务端模块，仅供 RSC 引用，勿进 client bundle）。
 * 不用 node:fs readdir——vinext 跑在 worker 环境（@cloudflare/vite-plugin），
 * 生产构建没有真实文件系统；import.meta.glob("?raw") 在构建期把全部 JSONL
 * 内联进来，新增 receipts 文件不改代码即可被 glob 捕获。
 * 单行解析失败跳过，不让脏行打挂整页。
 */

export interface ReceiptEntry {
  runId: string;
  network: string;
  campaign: string;
  action: string;
  actor: string;
  contract: string;
  txHash: string;
  ts: string;
  /** receipts 目录内相对路径（如 rehearsal/testnet-….jsonl）。 */
  file: string;
}

const receiptModules = import.meta.glob(
  "../../deployments/receipts/**/*.jsonl",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

function parseReceipt(value: unknown, file: string): ReceiptEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.txHash !== "string" ||
    typeof v.campaign !== "string" ||
    typeof v.action !== "string" ||
    typeof v.actor !== "string" ||
    typeof v.ts !== "string"
  ) {
    return null;
  }
  return {
    runId: typeof v.runId === "string" ? v.runId : "",
    network: typeof v.network === "string" ? v.network : "",
    campaign: v.campaign,
    action: v.action,
    actor: v.actor,
    contract: typeof v.contract === "string" ? v.contract : "",
    txHash: v.txHash,
    ts: v.ts,
    file,
  };
}

/** 全部 receipts 行（按时间升序）。 */
export const receiptEntries: ReceiptEntry[] = Object.entries(receiptModules)
  .flatMap(([path, raw]) => {
    const file =
      path.split("/deployments/receipts/")[1] ??
      path.split("/").pop() ??
      path;
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        try {
          return parseReceipt(JSON.parse(line), file);
        } catch {
          return null;
        }
      })
      .filter((entry): entry is ReceiptEntry => entry !== null);
  })
  .sort((a, b) => a.ts.localeCompare(b.ts));
