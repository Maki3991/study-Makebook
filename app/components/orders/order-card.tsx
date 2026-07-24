"use client";

import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  useAccount,
  useCampaign,
  useMyOrder,
  deriveMyOrderStatus,
  useNowSec,
} from "@/app/lib/chain/hooks";
import { useClaimRefund } from "@/app/lib/chain/write";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { copy } from "@/app/lib/copy";
import { formatInj, explorerTx } from "@/app/lib/chain/format";

type OrderCardProps = {
  id: CampaignId;
};

export function OrderCard({ id }: OrderCardProps) {
  const { address } = useAccount();
  const campaign = useCampaign(id);
  const myOrderQuery = useMyOrder(id, address);
  const claim = useClaimRefund(id);
  const now = useNowSec();

  const meta = CAMPAIGNS[id];
  const state = campaign.state;
  const deadline = campaign.deadline;
  const clearingPrice = campaign.clearingPrice;

  const myOrder = myOrderQuery.data as
    | { buyer: `0x${string}`; variantHash: `0x${string}`; maxPriceWei: bigint; refundClaimed: boolean }
    | undefined;

  const status = deriveMyOrderStatus(
    state,
    deadline,
    myOrder,
    clearingPrice,
  );

  const isPastDeadline =
    state === "Open" && deadline !== undefined && now >= Number(deadline);

  const handleClaim = async () => {
    await claim.claimRefund();
  };

  const statusText = (() => {
    if (status === "escrowed") {
      return copy.orders.escrowed.replace(
        "{date}",
        deadline
          ? new Date(Number(deadline) * 1000).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
      );
    }
    if (status === "awaiting_settle") {
      return copy.orders.awaitingSettle;
    }
    if (status === "refund_diff") {
      const diff = myOrder ? myOrder.maxPriceWei - (clearingPrice ?? 0n) : 0n;
      if (diff === 0n) {
        return copy.orders.noRefundNeeded;
      }
      return copy.orders.refundDiff.replace("{amount}", formatInj(diff));
    }
    if (status === "refund_full") {
      return copy.orders.refundFull.replace(
        "{amount}",
        formatInj(myOrder?.maxPriceWei ?? 0n),
      );
    }
    if (status === "claimed") {
      return copy.orders.claimed;
    }
    return copy.orders.empty.none;
  })();

  const ctaText = (() => {
    if (status === "awaiting_settle" || (status === "escrowed" && isPastDeadline)) {
      return copy.orders.settle;
    }
    if (status === "refund_diff") {
      const diff = myOrder ? myOrder.maxPriceWei - (clearingPrice ?? 0n) : 0n;
      if (diff === 0n) {
        return copy.orders.noRefundNeeded;
      }
      return copy.orders.claim.replace("{amount}", formatInj(diff));
    }
    if (status === "refund_full") {
      return copy.orders.claim.replace(
        "{amount}",
        formatInj(myOrder?.maxPriceWei ?? 0n),
      );
    }
    return null;
  })();

  if (!myOrder) {
    return null;
  }

  const isBusy = claim.stage === "signing" || claim.stage === "confirming";

  return (
    <article className="surface p-5 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">{meta.product}</h3>
          <p className="mt-0.5 text-sm text-ink-2">
            {meta.batchName}
            {id === "failure" && (
              <span className="ml-2 text-ink-3">({copy.batch.b.note})</span>
            )}
          </p>
          <p className="mt-3 text-sm text-ink-2">
            Your bid{" "}
            <span className="num font-medium text-ink">
              {formatInj(myOrder.maxPriceWei)}
            </span>{" "}
            test INJ
          </p>
          <p
            className={`mt-2 text-sm font-medium ${
              status === "claimed"
                ? "text-ink-3"
                : status === "refund_diff" || status === "refund_full"
                  ? "text-accent"
                  : "text-ink-2"
            }`}
          >
            {statusText}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          {ctaText && (
            <>
              {status === "awaiting_settle" || (status === "escrowed" && isPastDeadline) ? (
                <Link
                  href={`/campaigns/${id}`}
                  className="btn btn-primary inline-flex"
                >
                  {ctaText}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={isBusy}
                  className="btn btn-primary inline-flex"
                >
                  {isBusy ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {copy.drawer.confirming}
                    </>
                  ) : (
                    ctaText
                  )}
                </button>
              )}
            </>
          )}

          {claim.result && (
            <a
              href={explorerTx(claim.result.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              {copy.orders.viewTx}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {claim.error && (
        <p className="mt-4 text-sm text-danger">{claim.error}</p>
      )}
    </article>
  );
}
