import type { Address } from "viem";

export type CampaignId = "success" | "failure" | "bracelet";

export type CampaignState = "Draft" | "Open" | "Succeeded" | "Failed" | "PaidOut";

export const CampaignStateEnum = {
  Draft: 0,
  Open: 1,
  Succeeded: 2,
  Failed: 3,
  PaidOut: 4,
} as const;

export function parseCampaignState(value: number): CampaignState {
  switch (value) {
    case 0:
      return "Draft";
    case 1:
      return "Open";
    case 2:
      return "Succeeded";
    case 3:
      return "Failed";
    case 4:
      return "PaidOut";
    default:
      throw new Error(`Unknown campaign state: ${value}`);
  }
}

export type QuoteView = {
  quoteId: number;
  factory: Address;
  quoteHash: `0x${string}`;
  tiers: Array<{
    minQty: number;
    unitPriceWei: bigint;
  }>;
};

export type OrderView = {
  buyer: Address;
  variantHash: `0x${string}`;
  maxPriceWei: bigint;
  refundClaimed: boolean;
};

// previewSettlement() returns (feasible, quoteId, tierIndex, clearingPrice, winnerCount)
export type PreviewView = [
  boolean,
  bigint,
  bigint,
  bigint,
  bigint,
];

export type MyOrderStatus =
  | "none"
  | "escrowed"
  | "awaiting_settle"
  | "refund_diff"
  | "refund_full"
  | "claimed";

export type DemandPoint = {
  price: number;
  count: number;
};
