"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  useAccount,
  useCampaign,
  useMyOrder,
  deriveMyOrderStatus,
  useNowSec,
  useSettleTx,
} from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj, explorerTx, truncateAddress } from "@/app/lib/chain/format";

export function ResultBlock({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const { address } = useAccount();
  const campaign = useCampaign(id);
  const myOrderQuery = useMyOrder(id, address);
  // Spec 009 §4.4: the settle tx hash is read from the on-chain
  // CampaignSettled event — no off-chain source needed.
  const settleTx = useSettleTx(id);

  const state = campaign.state;
  const deadline = campaign.deadline;
  const clearingPrice = campaign.clearingPrice;
  const winnerCount = campaign.winnerCount;

  // Still open and before deadline: hide.
  const now = useNowSec();
  if (
    state === "Open" &&
    deadline !== undefined &&
    now < Number(deadline)
  ) {
    return null;
  }

  const myOrder = myOrderQuery.data as
    | { buyer: `0x${string}`; variantHash: `0x${string}`; maxPriceWei: bigint; refundClaimed: boolean }
    | undefined;

  const status = deriveMyOrderStatus(
    state,
    deadline,
    myOrder,
    clearingPrice,
  );

  const isSuccess = state === "Succeeded" || state === "PaidOut";
  const isFailure = state === "Failed";

  if (!isSuccess && !isFailure) {
    // Awaiting settlement (Open but past deadline).
    return null;
  }

  return (
    <section className="section">
      <h2 className="text-h2 text-ink">{copy.result.title}</h2>

      {isSuccess ? (
        <p className="num mt-2 text-body font-medium text-accent">
          {copy.result.success
            .replace("{price}", formatInj(clearingPrice ?? 0n))
            .replace("{count}", winnerCount?.toString() ?? "—")}
        </p>
      ) : (
        <p className="mt-2 text-body font-medium text-danger">
          {copy.result.failure}
        </p>
      )}

      {state === "PaidOut" && (
        <p className="mt-2 text-body text-ink-2">{copy.result.factoryPaidOut}</p>
      )}

      {settleTx.data ? (
        <a
          href={explorerTx(settleTx.data)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-body text-accent hover:underline"
        >
          {copy.result.viewSettleTx}
          <span className="num text-micro">{truncateAddress(settleTx.data)}</span>
          <ExternalLink size={14} />
        </a>
      ) : null}

      {myOrder ? (
        <div className="mt-4 border-t border-line pt-4">
          {status === "refund_diff" ? (
            <p className="text-body text-ink">
              {copy.result.mine.win
                .replace("{clearing}", formatInj(clearingPrice ?? 0n))
                .replace(
                  "{diff}",
                  formatInj(myOrder.maxPriceWei - (clearingPrice ?? 0n)),
                )}
            </p>
          ) : status === "refund_full" ? (
            <p className="text-body text-ink">
              {copy.result.mine.lose.replace(
                "{amount}",
                formatInj(myOrder.maxPriceWei),
              )}
            </p>
          ) : status === "claimed" ? (
            <p className="text-body text-success">{copy.result.mine.claimed}</p>
          ) : null}

          {(status === "refund_diff" || status === "refund_full") && (
            <Link href="/orders" className="btn btn-primary mt-4 inline-flex">
              {copy.result.goClaim}
            </Link>
          )}
        </div>
      ) : null}
    </section>
  );
}
