import type { Copy } from "../copy";

export type ErrorMap = Record<string, string>;

// The dictionary's `errors` keys mirror the on-chain custom error names, so the
// map is a plain lookup into the active language pack. The copy object is
// passed in by the caller (a hook reading `useCopy()`) so Chinese users get
// the Chinese messages instead of the statically imported English pack.
export function mapErrorName(
  errorName: string | undefined,
  copy: Copy,
): string {
  if (!errorName) return copy.errors.fallback;
  const table = copy.errors as ErrorMap;
  return table[errorName] ?? copy.errors.fallback;
}

export function humanizeError(err: unknown, copy: Copy): string {
  if (err instanceof Error && err.message.includes("User rejected the request")) {
    return copy.errors.UserRejected;
  }
  if (err instanceof Error && err.message.includes("rejected")) {
    return copy.errors.UserRejected;
  }
  if (err instanceof Error && err.message.includes("Insufficient funds")) {
    return copy.errors.InsufficientFunds;
  }
  return copy.errors.fallback;
}
