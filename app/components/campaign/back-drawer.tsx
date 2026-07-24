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
import { copy } from "@/app/lib/copy";
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
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const meta = CAMPAIGNS[id];
  const productTitle = meta.product;

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
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <DrawerBody>
          {stage === "success" && result ? (
            <div className="space-y-5">
              <div className="rounded-md bg-success-soft p-4 text-sm font-medium text-success">
                {copy.drawer.success}
              </div>
              <p className="text-sm text-ink-2">
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
                  View on Blockscout
                  <ExternalLink size={14} />
                </a>
                <p className="num text-center text-xs text-ink-3">
                  {truncateAddress(result.txHash)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-ink">
                {copy.drawer.summary
                  .replace("{product}", productTitle)
                  .replace("{price}", maxPrice)}
              </p>

              <div className="legal space-y-3 text-sm text-ink-2">
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
                  <span className="pt-0.5 text-sm leading-5 text-ink-2">
                    {copy.drawer.check1}
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={checked2}
                    onCheckedChange={(v) => setChecked2(Boolean(v))}
                    disabled={isBusy}
                  />
                  <span className="pt-0.5 text-sm leading-5 text-ink-2">
                    {copy.drawer.check2}
                  </span>
                </label>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}
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
