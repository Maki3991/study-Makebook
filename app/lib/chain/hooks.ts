"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAccount,
  useReadContract,
} from "wagmi";
import {
  type Address,
  ContractFunctionRevertedError,
  parseEventLogs,
} from "viem";
import { makebookAbi } from "./abi";
import { publicClient } from "./client";
import {
  CAMPAIGNS,
  type CampaignId,
  POLL_INTERVAL_MS,
} from "./config";
import {
  type DemandPoint,
  type MyOrderStatus,
  type OrderView,
  type PreviewView,
  type QuoteView,
  parseCampaignState,
} from "../types";
import { formatUnits } from "viem";
import { loadCampaignManifest, type ManifestResult } from "../manifest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function campaignAddress(id: CampaignId): Address {
  const addr = CAMPAIGNS[id].deployment?.address;
  if (!addr) throw new Error(`Campaign "${id}" is not deployed`);
  return addr as Address;
}

function deployBlock(id: CampaignId): bigint {
  const block = CAMPAIGNS[id].deployment?.deployBlock;
  if (block === undefined) throw new Error(`Campaign "${id}" has no deployBlock`);
  return BigInt(block);
}

async function fetchOrderPlacedEvents(
  address: Address,
  fromBlock: bigint,
): Promise<{ buyer: Address; maxPrice: bigint; variantHash: `0x${string}` }[]> {
  const latest = await publicClient.getBlockNumber();
  const chunkSize = 5000n;
  const allLogs = [] as Awaited<ReturnType<typeof publicClient.getLogs>>;

  for (let start = fromBlock; start <= latest; start += chunkSize) {
    const end = start + chunkSize - 1n > latest ? latest : start + chunkSize - 1n;
    const logs = await publicClient.getLogs({
      address,
      event: {
        type: "event",
        name: "OrderPlaced",
        inputs: [
          { type: "address", name: "buyer", indexed: true },
          { type: "uint256", name: "maxPrice" },
          { type: "bytes32", name: "variantHash" },
        ],
      },
      fromBlock: start,
      toBlock: end,
    });
    allLogs.push(...logs);
  }

  const parsed = parseEventLogs({
    abi: makebookAbi,
    eventName: "OrderPlaced",
    logs: allLogs,
  });

  return parsed.map((log) => ({
    buyer: log.args.buyer as Address,
    maxPrice: log.args.maxPrice as bigint,
    variantHash: log.args.variantHash as `0x${string}`,
  }));
}

async function fetchOrder(
  campaign: Address,
  buyer: Address,
): Promise<OrderView | null> {
  try {
    const result = (await publicClient.readContract({
      address: campaign,
      abi: makebookAbi,
      functionName: "getOrder",
      args: [buyer],
    })) as {
      buyer: Address;
      variantHash: `0x${string}`;
      maxPriceWei: bigint;
      refundClaimed: boolean;
    };

    return {
      buyer: result.buyer,
      variantHash: result.variantHash,
      maxPriceWei: result.maxPriceWei,
      refundClaimed: result.refundClaimed,
    };
  } catch (err) {
    if (err instanceof ContractFunctionRevertedError) {
      if (err.data?.errorName === "NoOrder" || err.signature === "0x19aad573") {
        return null;
      }
    }
    // Re-throw unexpected errors so they surface in the query.
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Campaign aggregate read
// ---------------------------------------------------------------------------

type BaseReadResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

function useBaseRead<T>(
  address: Address,
  functionName: string,
  enabled: boolean,
): BaseReadResult<T> {
  const result = useReadContract({
    address,
    abi: makebookAbi,
    functionName: functionName as never,
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      enabled,
    },
  });
  return result as BaseReadResult<T>;
}

export function useCampaign(id: CampaignId) {
  const address = campaignAddress(id);
  const meta = CAMPAIGNS[id];
  const enabled = meta.deployed;

  const state = useBaseRead<number>(address, "state", enabled);
  const deadline = useBaseRead<bigint>(address, "deadline", enabled);
  const ordersLength = useBaseRead<bigint>(address, "ordersLength", enabled);
  const preview = useBaseRead<PreviewView>(address, "previewSettlement", enabled);
  const quotesLength = useBaseRead<bigint>(address, "quotesLength", enabled);
  const manifestHash = useBaseRead<`0x${string}`>(address, "manifestHash", enabled);
  const winningQuoteId = useBaseRead<bigint>(address, "winningQuoteId", enabled);
  const winningTierIndex = useBaseRead<bigint>(address, "winningTierIndex", enabled);
  const clearingPrice = useBaseRead<bigint>(address, "clearingPrice", enabled);
  const winnerCount = useBaseRead<bigint>(address, "winnerCount", enabled);
  const selectedFactory = useBaseRead<Address>(address, "selectedFactory", enabled);
  const factoryReceivable = useBaseRead<bigint>(address, "factoryReceivable", enabled);
  const factoryPayoutClaimed = useBaseRead<boolean>(address, "factoryPayoutClaimed", enabled);

  // MAX_FACTORIES is 2 on the contract, so at most 2 quotes. Hard-code two
  // hook calls so we stay inside the Rules of Hooks.
  const quote0 = useReadContract({
    address,
    abi: makebookAbi,
    functionName: "getQuote",
    args: [0n],
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      enabled: enabled && Number(quotesLength.data ?? 0n) > 0,
    },
  });
  const quote1 = useReadContract({
    address,
    abi: makebookAbi,
    functionName: "getQuote",
    args: [1n],
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      enabled: enabled && Number(quotesLength.data ?? 0n) > 1,
    },
  });

  const quoteReads = [quote0, quote1];

  const quotes: QuoteView[] = quoteReads
    .map((res, idx) => {
      const r = res.data as
        | {
            factory: Address;
            quoteHash: `0x${string}`;
            tiers: Array<{ minQty: number; unitPriceWei: bigint }>;
          }
        | undefined;
      if (!r) return null;
      return {
        quoteId: idx,
        factory: r.factory,
        quoteHash: r.quoteHash,
        tiers: r.tiers.map((t) => ({
          minQty: Number(t.minQty),
          unitPriceWei: t.unitPriceWei,
        })),
      };
    })
    .filter((q): q is QuoteView => q !== null);

  const reads = [
    state,
    deadline,
    ordersLength,
    preview,
    quotesLength,
    manifestHash,
    winningQuoteId,
    winningTierIndex,
    clearingPrice,
    winnerCount,
    selectedFactory,
    factoryReceivable,
    factoryPayoutClaimed,
    quote0,
    quote1,
  ];

  const isLoading = reads.some((r) => r.isLoading);
  const isError = reads.some((r) => r.isError);
  const error = reads.find((r) => r.error)?.error;

  return {
    meta,
    address,
    stateRaw: state.data,
    state: state.data !== undefined ? parseCampaignState(state.data) : undefined,
    deadline: deadline.data,
    ordersLength: ordersLength.data,
    preview: preview.data,
    quotes,
    manifestHash: manifestHash.data,
    winningQuoteId: winningQuoteId.data,
    winningTierIndex: winningTierIndex.data,
    clearingPrice: clearingPrice.data,
    winnerCount: winnerCount.data,
    selectedFactory: selectedFactory.data,
    factoryReceivable: factoryReceivable.data,
    factoryPayoutClaimed: factoryPayoutClaimed.data,
    isLoading,
    isError,
    error,
    refetch: () => reads.forEach((r) => r.refetch()),
  };
}

// ---------------------------------------------------------------------------
// Orders from events + individual getOrder calls
// ---------------------------------------------------------------------------

export function useOrders(id: CampaignId) {
  const address = campaignAddress(id);

  return useQuery({
    queryKey: ["orders", id],
    queryFn: async (): Promise<OrderView[]> => {
      const events = await fetchOrderPlacedEvents(address, deployBlock(id));
      const uniqueBuyers = Array.from(new Set(events.map((e) => e.buyer)));

      const results = await Promise.all(
        uniqueBuyers.map((buyer) => fetchOrder(address, buyer)),
      );

      return results.filter((o): o is OrderView => o !== null);
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2,
    retry: 2,
    enabled: true,
  });
}

// ---------------------------------------------------------------------------
// My order (single address, tolerates NoOrder)
// ---------------------------------------------------------------------------

export function useMyOrder(id: CampaignId, myAddress?: Address) {
  const meta = CAMPAIGNS[id];
  const enabled = meta.deployed && !!myAddress;

  return useReadContract({
    address: (meta.deployment?.address as Address) ?? "0x0",
    abi: makebookAbi,
    functionName: "getOrder",
    args: myAddress ? [myAddress] : undefined,
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      enabled,
    },
  });
}

// ---------------------------------------------------------------------------
// Derived: demand curve points
// ---------------------------------------------------------------------------

export function useDemandPoints(orders: OrderView[] | undefined): DemandPoint[] {
  if (!orders || orders.length === 0) return [];
  const sorted = [...orders]
    .map((o) => Number(formatUnits(o.maxPriceWei, 18)))
    .sort((a, b) => b - a);
  return sorted.map((price, i) => ({
    price,
    count: sorted.length - i,
  }));
}

// ---------------------------------------------------------------------------
// Derived: eligible count for a quote tier
// ---------------------------------------------------------------------------

export function eligibleCount(
  orders: OrderView[],
  unitPriceWei: bigint,
): number {
  return orders.filter((o) => o.maxPriceWei >= unitPriceWei).length;
}

// ---------------------------------------------------------------------------
// My order status
// ---------------------------------------------------------------------------

export function deriveMyOrderStatus(
  state: ReturnType<typeof useCampaign>["state"],
  deadline: bigint | undefined,
  myOrder: OrderView | null | undefined,
  clearingPrice: bigint | undefined,
): MyOrderStatus {
  if (!myOrder) return "none";

  const now = Math.floor(Date.now() / 1000);

  if (state === "Open" && deadline !== undefined && now < Number(deadline)) {
    return "escrowed";
  }
  if (state === "Open" && deadline !== undefined && now >= Number(deadline)) {
    return "awaiting_settle";
  }
  if (state === "Failed") {
    return myOrder.refundClaimed ? "claimed" : "refund_full";
  }
  if (state === "Succeeded" || state === "PaidOut") {
    if (myOrder.refundClaimed) return "claimed";
    if (myOrder.maxPriceWei >= (clearingPrice ?? 0n)) return "refund_diff";
    return "refund_full";
  }
  return "none";
}

// ---------------------------------------------------------------------------
// Manifest validation
// ---------------------------------------------------------------------------

export function useManifest(id: CampaignId, onChainHash?: `0x${string}`) {
  return useQuery<ManifestResult>({
    queryKey: ["manifest", id, onChainHash],
    queryFn: () => loadCampaignManifest(id, onChainHash),
    enabled: CAMPAIGNS[id].deployed,
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Convenience: current account
// ---------------------------------------------------------------------------

export { useAccount };

// ---------------------------------------------------------------------------
// Purity-safe current time (seconds)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Console role reads
// ---------------------------------------------------------------------------

export function useOperator(id: CampaignId) {
  const meta = CAMPAIGNS[id];
  const enabled = meta.deployed;

  return useReadContract({
    address: (meta.deployment?.address as Address) ?? "0x0",
    abi: makebookAbi,
    functionName: "operator",
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      enabled,
    },
  });
}

export function useIsRegisteredFactory(
  id: CampaignId,
  factory?: Address,
) {
  const meta = CAMPAIGNS[id];
  const enabled = meta.deployed && !!factory;

  return useReadContract({
    address: (meta.deployment?.address as Address) ?? "0x0",
    abi: makebookAbi,
    functionName: "isRegisteredFactory",
    args: factory ? [factory] : undefined,
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      enabled,
    },
  });
}

export function useHasQuoted(id: CampaignId, factory?: Address) {
  const meta = CAMPAIGNS[id];
  const enabled = meta.deployed && !!factory;

  return useReadContract({
    address: (meta.deployment?.address as Address) ?? "0x0",
    abi: makebookAbi,
    functionName: "hasQuoted",
    args: factory ? [factory] : undefined,
    query: {
      refetchInterval: POLL_INTERVAL_MS,
      enabled,
    },
  });
}

export type ConsoleRole = "guest" | "viewer" | "operator" | "factory";

const ALL_CAMPAIGN_IDS: CampaignId[] = ["success", "failure", "bracelet"];

export function useConsoleRole(address?: Address): {
  role: ConsoleRole;
  isLoading: boolean;
} {
  // Call hooks for every possible campaign in fixed order to obey Rules of Hooks.
  const operator0 = useOperator(ALL_CAMPAIGN_IDS[0]);
  const operator1 = useOperator(ALL_CAMPAIGN_IDS[1]);
  const operator2 = useOperator(ALL_CAMPAIGN_IDS[2]);
  const factory0 = useIsRegisteredFactory(ALL_CAMPAIGN_IDS[0], address);
  const factory1 = useIsRegisteredFactory(ALL_CAMPAIGN_IDS[1], address);
  const factory2 = useIsRegisteredFactory(ALL_CAMPAIGN_IDS[2], address);

  const operatorReads = [operator0, operator1, operator2];
  const factoryReads = [factory0, factory1, factory2];

  const isLoading = [...operatorReads, ...factoryReads].some((r) => r.isLoading);

  if (!address) {
    return { role: "guest", isLoading: false };
  }

  const isOperator = operatorReads
    .filter((_, idx) => CAMPAIGNS[ALL_CAMPAIGN_IDS[idx]].deployed)
    .some((r) => r.data?.toLowerCase() === address.toLowerCase());

  const isFactory = factoryReads
    .filter((_, idx) => CAMPAIGNS[ALL_CAMPAIGN_IDS[idx]].deployed)
    .some((r) => r.data === true);

  if (isOperator) return { role: "operator", isLoading };
  if (isFactory) return { role: "factory", isLoading };
  return { role: "viewer", isLoading };
}

// ---------------------------------------------------------------------------
// Purity-safe current time (seconds)
// ---------------------------------------------------------------------------

export function useNowSec(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      const id = setInterval(
        () => onStoreChange(),
        1000,
      );
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );
}
