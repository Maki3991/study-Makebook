"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@/app/components/ui/drawer";
import { Checkbox } from "@/app/components/ui/checkbox";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCampaign } from "@/app/lib/chain/hooks";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj, explorerTx, truncateAddress } from "@/app/lib/chain/format";
import { TxStage, PlaceOrderResult } from "@/app/lib/chain/write";
import { X, ExternalLink, Loader2 } from "lucide-react";

type BackDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: CampaignId;
  maxPrice: string;
  stage: TxStage;
  error: string | null;
  result: PlaceOrderResult | null;
  onSubmit: () => Promise<void>;
  onReset: () => void;
};

export function BackDrawer({
  open,
  onOpenChange,
  id,
  maxPrice,
  stage,
  error,
  result,
  onSubmit,
  onReset,
}: BackDrawerProps) {
  const copy = useCopy();
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const meta = CAMPAIGNS[id];
  const productTitle = meta.product;
  const campaign = useCampaign(id);

  // Spec 009 §3.2 C3: per-unit price breakdown for the tier the current
  // preview would settle at. The platform fee is carved OUT of the clearing
  // price (creator gets markup − fee), never added on top of it.
  // Hidden when the preview is infeasible — there is no uniform price yet,
  // and inventing one would be a fabrication.
  const marginBps = campaign.marginBps;
  const feeBps = campaign.feeBps;
  const preview = campaign.preview;
  let breakdown:
    | {
        tierWei: bigint;
        markupWei: bigint;
        retailWei: bigint;
        creatorWei: bigint;
        platformWei: bigint;
      }
    | undefined;
  if (marginBps !== undefined && feeBps !== undefined && preview?.[0]) {
    const quoteId = Number(preview[1]);
    const tierIndex = Number(preview[2]);
    const tierWei = campaign.quotes.find((q) => q.quoteId === quoteId)?.tiers[
      tierIndex
    ]?.unitPriceWei;
    if (tierWei !== undefined) {
      const retailWei = (tierWei * (10000n + BigInt(marginBps))) / 10000n;
      const platformWei = (retailWei * BigInt(feeBps)) / 10000n;
      breakdown = {
        tierWei,
        markupWei: retailWei - tierWei,
        retailWei,
        creatorWei: retailWei - tierWei - platformWei,
        platformWei,
      };
    }
  }

  const canSubmit = checked1 && checked2;
  const isBusy = stage === "signing" || stage === "confirming";

  const handleOpenChange = (next: boolean) => {
    if (!next && isBusy) return;
    onOpenChange(next);
    if (!next) {
      onReset();
      setChecked1(false);
      setChecked2(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div>
            <DrawerTitle>{copy.drawer.title}</DrawerTitle>
            <DrawerDescription className="mt-1">
              {copy.drawer.step}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              disabled={isBusy}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-2 hover:bg-surface disabled:opacity-50"
              aria-label={copy.global.a11y.close}
            >
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <DrawerBody>
          {stage === "success" && result ? (
            <div className="space-y-5">
              <div className="rounded-md bg-success-soft p-4 text-body font-medium text-success">
                {copy.drawer.success}
              </div>
              <p className="text-body text-ink-2">
                {copy.drawer.summary
                  .replace("{product}", productTitle)
                  .replace("{price}", formatInj(result.maxPriceWei))}
              </p>
              <div className="space-y-2">
                <a
                  href={explorerTx(result.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full"
                >
                  {copy.drawer.viewTxBlockscout}
                  <ExternalLink size={14} />
                </a>
                <p className="num text-center text-micro text-ink-3">
                  {truncateAddress(result.txHash)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-body text-ink">
                {copy.drawer.summary
                  .replace("{product}", productTitle)
                  .replace("{price}", maxPrice)}
              </p>

              {breakdown && (
                <div className="border border-line p-3">
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-body text-ink-2">
                        {copy.drawer.breakdown.factory}
                      </span>
                      <span className="num text-body text-ink">
                        {formatInj(breakdown.tierWei)}
                        <span className="text-micro text-ink-3"> test INJ</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-body text-ink-2">
                        {copy.drawer.breakdown.markup.replace(
                          "{factor}",
                          String((10000 + marginBps!) / 10000),
                        )}
                      </span>
                      <span className="num text-body text-ink">
                        + {formatInj(breakdown.markupWei)}
                        <span className="text-micro text-ink-3"> test INJ</span>
                      </span>
                    </div>
                  </div>
                  <div className="hairline my-2" />
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-body font-medium text-ink">
                      {copy.drawer.breakdown.youPay}
                    </span>
                    <span className="num text-body font-medium text-ink">
                      {formatInj(breakdown.retailWei)}
                      <span className="text-micro font-normal text-ink-3">
                        {" "}
                        test INJ
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-micro text-ink-3">
                        {copy.drawer.breakdown.ofWhich} ·{" "}
                        {copy.drawer.breakdown.creatorNet}{" "}
                        {copy.drawer.breakdown.creatorNetNote}
                      </span>
                      <span className="num text-micro text-ink-2">
                        {formatInj(breakdown.creatorWei)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-micro text-ink-3">
                        {copy.drawer.breakdown.platformFee}{" "}
                        {copy.drawer.breakdown.platformFeeNote.replace(
                          "{pct}",
                          String(feeBps! / 100),
                        )}
                      </span>
                      <span className="num text-micro text-ink-2">
                        {formatInj(breakdown.platformWei)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="legal space-y-3 text-body text-ink-2">
                <p>
                  {copy.drawer.legal1
                    .replace("{product}", productTitle)
                    .replace("{price}", maxPrice)}
                </p>
                <p>{copy.drawer.legal2}</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={checked1}
                    onCheckedChange={(v) => setChecked1(Boolean(v))}
                    disabled={isBusy}
                  />
                  <span className="pt-0.5 text-body leading-5 text-ink-2">
                    {copy.drawer.check1}
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={checked2}
                    onCheckedChange={(v) => setChecked2(Boolean(v))}
                    disabled={isBusy}
                  />
                  <span className="pt-0.5 text-body leading-5 text-ink-2">
                    {copy.drawer.check2}
                  </span>
                </label>
              </div>

              {error && (
                <p role="alert" className="text-body text-danger">
                  {error}
                </p>
              )}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          {stage === "success" ? (
            <Link
              href="/orders"
              onClick={() => handleOpenChange(false)}
              className="btn btn-primary w-full"
            >
              {copy.drawer.viewOrder}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || isBusy}
              className="btn btn-primary w-full"
            >
              {isBusy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {stage === "signing"
                    ? copy.drawer.signing
                    : copy.drawer.confirming}
                </>
              ) : error ? (
                copy.drawer.retry
              ) : (
                copy.drawer.submit.replace("{price}", maxPrice)
              )}
            </button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
