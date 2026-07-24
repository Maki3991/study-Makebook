import { copy } from "../copy";

export type ErrorMap = Record<string, string>;

const errorMap: ErrorMap = {
  UserRejected: copy.errors.UserRejected,
  WrongNetwork: copy.errors.WrongNetwork,
  InsufficientFunds: copy.errors.InsufficientFunds,
  InvalidPayment: copy.errors.InvalidPayment,
  DuplicateOrder: copy.errors.DuplicateOrder,
  OrderLimitReached: copy.errors.OrderLimitReached,
  CampaignNotOpen: copy.errors.CampaignNotOpen,
  WrongState: copy.errors.WrongState,
  DeadlinePassed: copy.errors.DeadlinePassed,
  DeadlineNotReached: copy.errors.DeadlineNotReached,
  NoOrder: copy.errors.NoOrder,
  AlreadyClaimed: copy.errors.AlreadyClaimed,
  NotSelectedFactory: copy.errors.NotSelectedFactory,
  TransferFailed: copy.errors.TransferFailed,
  RpcError: copy.errors.RpcError,
};

export function mapErrorName(errorName: string | undefined): string {
  if (!errorName) return copy.errors.fallback;
  return errorMap[errorName] ?? copy.errors.fallback;
}

export function humanizeError(err: unknown): string {
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
