import { formatUnits } from "viem";
import { EXPLORER_BASE } from "./config";

/**
 * Format wei to a human-readable INJ string with ≤4 significant decimal places.
 * Examples:
 *   19000000000000000n -> "0.019"
 *   123456789000000000n -> "0.1235"
 *   1000000000000000000n -> "1"
 */
export function formatInj(wei: bigint | string | number): string {
  const value =
    typeof wei === "bigint"
      ? wei
      : BigInt(typeof wei === "number" ? Math.floor(wei) : wei);
  const raw = formatUnits(value, 18);
  const num = Number(raw);
  if (Number.isNaN(num)) return "0";

  // Keep up to 4 significant fractional digits, trimming trailing zeros.
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(num);

  return formatted;
}

export function formatInjWithUnit(wei: bigint | string | number): string {
  return `${formatInj(wei)} test INJ`;
}

export function truncateAddress(address: string | undefined): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function explorerTx(hash: `0x${string}` | string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerAddress(address: `0x${string}` | string): string {
  return `${EXPLORER_BASE}/address/${address}`;
}

export function getCountdownParts(
  deadlineSec: bigint | number | undefined,
  nowSec: number,
): { dd: number; hh: number; mm: number; expired: boolean } {
  if (deadlineSec === undefined) {
    return { dd: 0, hh: 0, mm: 0, expired: false };
  }
  const deadline = Number(deadlineSec);
  const diff = Math.max(0, deadline - nowSec);
  return {
    dd: Math.floor(diff / 86400),
    hh: Math.floor((diff % 86400) / 3600),
    mm: Math.floor((diff % 3600) / 60),
    expired: diff === 0 && nowSec >= deadline,
  };
}

export function formatCountdownParts(
  deadlineSec: bigint | number | undefined,
): { dd: number; hh: number; mm: number; expired: boolean } {
  return getCountdownParts(deadlineSec, Math.floor(Date.now() / 1000));
}

export function formatCountdown(deadlineSec: bigint | number | undefined): string {
  const parts = formatCountdownParts(deadlineSec);
  return `${parts.dd}d ${parts.hh}h ${parts.mm}m`;
}
