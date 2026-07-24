"use client";

import { AlertTriangle, Check, ExternalLink, Lock, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { INJ_DECIMALS, createInjPublicClient } from "@/app/lib/chain/chain";
import {
  campaignStateName,
  readOrder,
  type Order,
} from "@/app/lib/chain/reads";
import {
  formatInj,
  useCampaignData,
  useCountdown,
} from "@/app/lib/chain/use-campaign";
import {
  describePlaceOrderError,
  describeWriteError,
  placeOrder,
  shortenAddress,
  writeCampaignAction,
} from "@/app/lib/chain/wallet";
import {
  Button,
  CopyValue,
  ExplorerLink,
  SourceTag,
} from "@/app/components/site/primitives";
import { useSiteWallet } from "@/app/components/site/wallet-provider";

/**
 * Pledge panel — the sticky right rail of the campaign page (mounted into the
 * existing `#pledge` wrapper in app/page.tsx, which owns the sticky offset).
 *
 * Phases:
 * - Open batch: status card + connect / wrong-network / order form → review
 *   summary → placeOrder flow that escrows the max price through placeOrder
 *   (msg.value == maxPrice, wei bigint end to end; display only via
 *   formatUnits). When the wallet balance cannot cover maxPrice + gas, the
 *   submit/confirm button is replaced by the faucet guidance card.
 * - Settled batch (state >= Succeeded, onchain reads only): buyer refund
 *   claims and the selected factory's payout via writeCampaignAction.
 * - Fixture fallback (RPC down / demo build): numbers are tagged
 *   OFF-CHAIN DEMO and every write stays disabled.
 *
 * Error copy is English: known reverts are mapped here, unknowns fall back to
 * the lib translators (which return Chinese) behind an English backstop.
 */

const QUICK_PRICES = ["0.019", "0.021", "0.024", "0.026"] as const;

/** Injective testnet faucet — new wallets get free test INJ after hCaptcha. */
const FAUCET_URL = "https://testnet.faucet.injective.network/";

/** The wallet balance must cover the escrowed max price plus this gas headroom. */
const GAS_RESERVE_WEI = parseUnits("0.001", INJ_DECIMALS);

const LABEL_CLASS =
  "font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40";

// ---------------------------------------------------------------------------
// Error translation (site copy is English; the lib translators return Chinese)
// ---------------------------------------------------------------------------

const ORDER_REVERT_EN: Record<string, string> = {
  CampaignNotOpen: "This campaign is not open for orders.",
  DeadlinePassed:
    "The deadline has passed — this batch is no longer taking orders.",
  InvalidPayment:
    "Payment mismatch: the escrowed amount must equal your max price and be above zero.",
  DuplicateOrder:
    "This wallet already has an order in the batch — one order per wallet.",
  OrderLimitReached: "This batch is full (50 orders).",
};

const CLAIM_REVERT_EN: Record<string, string> = {
  WrongState: "Claims open after the batch settles.",
  NoOrder: "This wallet has no order in the batch.",
  AlreadyClaimed: "Already claimed — each wallet claims once.",
  NotSelectedFactory: "Only the selected factory wallet can claim the payout.",
  TransferFailed:
    "The transfer failed — please retry; your claim status did not change.",
};

function revertErrorName(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  return revert instanceof ContractFunctionRevertedError
    ? (revert.data?.errorName ?? null)
    : null;
}

function isUserRejection(err: unknown): boolean {
  return (
    err instanceof BaseError &&
    err.walk((e) => e instanceof UserRejectedRequestError) instanceof
      UserRejectedRequestError
  );
}

/** Last-resort guard so no Chinese fallback copy leaks into the panel. */
function englishBackstop(translated: string): string {
  return /[\u3000-\u30ff\u3400-\u9fff]/.test(translated)
    ? "The transaction failed — please try again."
    : translated;
}

function orderErrorMessage(err: unknown): string {
  const name = revertErrorName(err);
  if (name && ORDER_REVERT_EN[name]) return ORDER_REVERT_EN[name];
  if (isUserRejection(err)) {
    return "Signature cancelled in your wallet — no order was created and no funds moved.";
  }
  return englishBackstop(describePlaceOrderError(err));
}

function claimErrorMessage(err: unknown): string {
  const name = revertErrorName(err);
  if (name && CLAIM_REVERT_EN[name]) return CLAIM_REVERT_EN[name];
  if (isUserRejection(err)) {
    return "Signature cancelled in your wallet — no transaction was submitted.";
  }
  return englishBackstop(describeWriteError(err));
}

// ---------------------------------------------------------------------------
// Local state shapes
// ---------------------------------------------------------------------------

type OrderPhase =
  | { kind: "form" }
  | { kind: "review" }
  | { kind: "pending" }
  | { kind: "success"; hash: Hex; maxPriceWei: bigint }
  | { kind: "error"; message: string };

type ClaimAction = "claimRefund" | "claimPayout";

type ClaimFeedback =
  | { action: ClaimAction; kind: "pending" }
  | { action: ClaimAction; kind: "confirmed"; hash: Hex }
  | { action: ClaimAction; kind: "error"; message: string };

function parseMaxPrice(raw: string): { wei: bigint | null; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { wei: null, error: null };
  try {
    const wei = parseUnits(trimmed, INJ_DECIMALS);
    if (wei <= 0n) return { wei: null, error: "Enter a price above zero." };
    return { wei, error: null };
  } catch {
    return { wei: null, error: "Enter a valid decimal amount (up to 18 places)." };
  }
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function PanelSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Loading campaign panel"
    >
      <div className="surface flex flex-col gap-4 p-5">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-8 w-40" />
        <div className="line" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>
      <div className="surface flex flex-col gap-4 p-5">
        <div className="skeleton h-11 w-full" />
        <div className="skeleton h-11 w-full" />
      </div>
    </div>
  );
}

function ConnectBlock({
  connecting,
  onConnect,
  note,
}: {
  connecting: boolean;
  onConnect: () => void;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-13 leading-relaxed text-n-64">{note}</p>
      <Button
        variant="primary"
        className="w-full"
        state={connecting ? "loading" : "idle"}
        onClick={onConnect}
      >
        <span className="inline-flex items-center gap-2">
          <Wallet size={14} aria-hidden="true" />
          {connecting ? "Connecting…" : "Connect wallet"}
        </span>
      </Button>
      <p className="text-11 leading-relaxed text-n-40">
        The wallet asks you to approve the connection — no transaction is sent
        yet.
      </p>
    </div>
  );
}

function WrongNetworkBlock({
  switching,
  onSwitch,
}: {
  switching: boolean;
  onSwitch: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={15}
          className="mt-0.5 shrink-0 text-danger"
          aria-hidden="true"
        />
        <p className="text-13 leading-relaxed text-n-64">
          Your wallet is on another network. Orders and claims settle on
          Injective EVM Testnet (chain ID 1439).
        </p>
      </div>
      <Button
        variant="primary"
        className="btn-danger w-full"
        state={switching ? "loading" : "error"}
        onClick={onSwitch}
      >
        {switching ? "Switching…" : "Switch to Injective Testnet"}
      </Button>
    </div>
  );
}

/**
 * Faucet guidance card — replaces the review/confirm button whenever the
 * connected wallet cannot cover maxPrice + gas. "I already claimed" re-reads
 * the balance; once it covers the requirement the normal order UI returns.
 */
function FaucetCard({
  address,
  balanceWei,
  maxPriceWei,
  rechecking,
  note,
  onRecheck,
}: {
  address: Address;
  balanceWei: bigint;
  maxPriceWei: bigint;
  rechecking: boolean;
  note: string | null;
  onRecheck: () => void;
}) {
  return (
    <div className="surface-flat flex flex-col gap-3 p-4" role="status">
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={15}
          className="mt-0.5 shrink-0 text-n-40"
          aria-hidden="true"
        />
        <p className="text-13 leading-relaxed text-n-64">
          Insufficient balance — get free test INJ. This order escrows{" "}
          {formatInj(maxPriceWei)} test INJ plus ~0.001 for gas; this wallet
          holds {formatInj(balanceWei)}.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className={LABEL_CLASS}>Your wallet</span>
        <CopyValue value={address} display={shortenAddress(address)} />
      </div>
      <a
        href={FAUCET_URL}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary w-full"
      >
        Open the testnet faucet
        <ExternalLink size={14} aria-hidden="true" />
      </a>
      <Button
        variant="ghost"
        className="w-full"
        state={rechecking ? "loading" : "idle"}
        onClick={onRecheck}
      >
        I already claimed
      </Button>
      <p className="text-11 leading-relaxed text-n-40">
        New wallets get 1 free test INJ after hCaptcha.
      </p>
      {note ? (
        <p className="text-13 text-n-64" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function TxFeedback({
  feedback,
  action,
}: {
  feedback: ClaimFeedback | null;
  action: ClaimAction;
}) {
  if (!feedback || feedback.action !== action) return null;
  if (feedback.kind === "confirmed") {
    return (
      <p
        className="flex flex-wrap items-center gap-2 text-13 text-signal-onchain"
        role="status"
      >
        <Check size={14} aria-hidden="true" />
        Confirmed
        <ExplorerLink tx={feedback.hash}>View transaction</ExplorerLink>
      </p>
    );
  }
  if (feedback.kind === "error") {
    return (
      <p className="text-13 text-danger" role="alert">
        {feedback.message}
      </p>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// PledgePanel
// ---------------------------------------------------------------------------

export function PledgePanel() {
  const { status, view, reload } = useCampaignData("success");
  const {
    address,
    connected,
    connecting,
    connect,
    switchNetwork,
    isWrongNetwork,
  } = useSiteWallet();
  const countdown = useCountdown(view.deadline);
  const expired = countdown.expired;

  const [maxPrice, setMaxPrice] = useState("");
  const [confirmNoCancel, setConfirmNoCancel] = useState(false);
  const [confirmPublic, setConfirmPublic] = useState(false);
  const [orderPhase, setOrderPhase] = useState<OrderPhase>({ kind: "form" });
  const [precheckedOrder, setPrecheckedOrder] = useState<Order | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<ClaimFeedback | null>(null);
  const [switching, setSwitching] = useState(false);
  // Balance is stored bound to its owner address: a wallet switch makes the
  // stale reading ineligible by derivation (see balanceWei below), so the
  // fetch effect never needs a synchronous reset.
  const [balance, setBalance] = useState<{
    address: Address;
    wei: bigint;
  } | null>(null);
  const [recheckingBalance, setRecheckingBalance] = useState(false);
  const [faucetNote, setFaucetNote] = useState<string | null>(null);

  // Wallet switch resets all per-account interaction state (render-phase
  // adjust, the React-sanctioned alternative to setState in an effect).
  const [prevAddress, setPrevAddress] = useState(address);
  if (prevAddress !== address) {
    setPrevAddress(address);
    setOrderPhase({ kind: "form" });
    setPrecheckedOrder(null);
    setClaimFeedback(null);
  }

  // On-chain getOrder precheck: catches an existing order even when the event
  // scan window or a stale view would miss it. Read failures stay silent —
  // the contract enforces DuplicateOrder on submit anyway.
  useEffect(() => {
    if (!address || view.source !== "onchain") return;
    let cancelled = false;
    readOrder(createInjPublicClient(), view.address, address)
      .then((order) => {
        if (!cancelled && order) setPrecheckedOrder(order);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [address, view.address, view.source]);

  // Connected-wallet balance, driving the faucet guidance below. Re-read on
  // order-phase changes so a confirmed order reflects the drained balance.
  // Read failures keep the previous reading (or null) and never block.
  useEffect(() => {
    if (!address || !connected || isWrongNetwork) return;
    let cancelled = false;
    createInjPublicClient()
      .getBalance({ address })
      .then((wei) => {
        if (!cancelled) setBalance({ address, wei });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [address, connected, isWrongNetwork, orderPhase.kind]);

  const parsed = useMemo(() => parseMaxPrice(maxPrice), [maxPrice]);

  const canWrite = view.source === "onchain";
  // Display flag: fixture fallback views also describe a settled scenario
  // (tagged OFF-CHAIN DEMO), so the status card may show their numbers.
  const settled = view.settled && view.settlement !== null;
  // Interaction flag: the claim card (real writeCampaignAction calls) only
  // ever renders on live onchain reads — never on cached fixture data.
  const showClaims = canWrite && settled;
  const settlement = view.settlement;

  const viewOrder = address
    ? view.orders.find(
        (order) => order.buyer.toLowerCase() === address.toLowerCase(),
      )
    : undefined;
  const localOrder: Order | null =
    orderPhase.kind === "success" && address
      ? {
          buyer: address,
          variantHash: view.manifestHash,
          maxPriceWei: orderPhase.maxPriceWei,
          refundClaimed: false,
        }
      : null;
  const myOrder = viewOrder ?? precheckedOrder ?? localOrder ?? undefined;
  const myOrderTxHash =
    viewOrder?.txHash ??
    (orderPhase.kind === "success" ? orderPhase.hash : null);

  const isOpen = view.state === 1;
  // Everything the form → review → wallet flow needs; each transition
  // re-checks this before moving on or submitting.
  const formReady =
    canWrite &&
    isOpen &&
    !expired &&
    parsed.wei !== null &&
    confirmNoCancel &&
    confirmPublic &&
    !myOrder;

  // Faucet guidance: swap the submit/confirm button for the faucet card when
  // the wallet cannot cover escrow + gas. A failed balance read (null) never
  // blocks ordering — the wallet would surface the same problem at signing.
  const balanceWei =
    balance !== null &&
    address !== null &&
    connected &&
    !isWrongNetwork &&
    balance.address.toLowerCase() === address.toLowerCase()
      ? balance.wei
      : null;
  const requiredWei =
    parsed.wei !== null ? parsed.wei + GAS_RESERVE_WEI : null;
  const insufficientBalance =
    balanceWei !== null && requiredWei !== null && balanceWei < requiredWei;

  const recheckBalance = async () => {
    if (!address) return;
    setRecheckingBalance(true);
    setFaucetNote(null);
    try {
      const wei = await createInjPublicClient().getBalance({ address });
      setBalance({ address, wei });
      if (requiredWei !== null && wei < requiredWei) {
        setFaucetNote(
          "No new test INJ detected yet — the faucet drip can take a minute.",
        );
      }
    } catch {
      setFaucetNote("Balance check failed — please try again in a moment.");
    } finally {
      setRecheckingBalance(false);
    }
  };

  const isSelectedFactory = Boolean(
    showClaims &&
      settlement?.success &&
      address &&
      settlement.selectedFactory.toLowerCase() === address.toLowerCase(),
  );

  const refundWei =
    showClaims && settlement && myOrder
      ? !settlement.success || myOrder.maxPriceWei < settlement.clearingPrice
        ? myOrder.maxPriceWei
        : myOrder.maxPriceWei - settlement.clearingPrice
      : null;

  const onConnect = async () => {
    try {
      await connect();
    } catch {
      // Rejected wallet prompt — the connect state stays visible.
    }
  };

  const onSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await switchNetwork();
    } catch {
      // Rejected — the wrong-network state stays visible.
    } finally {
      setSwitching(false);
    }
  };

  const submitOrder = async () => {
    if (!address || parsed.wei === null || !formReady) return;
    if (orderPhase.kind === "pending") return;
    setOrderPhase({ kind: "pending" });
    try {
      // Duplicate precheck: a friendly stop before the wallet prompt; a read
      // failure does not block submission (the contract reverts instead).
      try {
        const prior = await readOrder(
          createInjPublicClient(),
          view.address,
          address,
        );
        if (prior) {
          setPrecheckedOrder(prior);
          setOrderPhase({ kind: "form" });
          return;
        }
      } catch {
        // Precheck RPC failure — continue; the contract enforces the rule.
      }
      const { hash } = await placeOrder(
        view.address,
        address,
        view.manifestHash,
        parsed.wei,
      );
      setOrderPhase({ kind: "success", hash, maxPriceWei: parsed.wei });
      reload();
    } catch (err) {
      setOrderPhase({ kind: "error", message: orderErrorMessage(err) });
    }
  };

  const runClaim = async (action: ClaimAction) => {
    if (!address) return;
    setClaimFeedback({ action, kind: "pending" });
    try {
      const hash = await writeCampaignAction(action, view.address, address);
      setClaimFeedback({ action, kind: "confirmed", hash });
      reload();
    } catch (err) {
      setClaimFeedback({
        action,
        kind: "error",
        message: claimErrorMessage(err),
      });
    }
  };

  if (status === "loading") return <PanelSkeleton />;

  // --- derived display values ------------------------------------------------

  const clearingCell = settled && settlement ? (
    <>
      {settlement.success ? formatInj(settlement.clearingPrice) : "—"}
      <span className="ml-2 text-13 font-normal text-n-52">
        {settlement.success
          ? `test INJ · ${String(settlement.winnerCount)} winners`
          : "batch failed"}
      </span>
    </>
  ) : view.ordersLength === 0 ? (
    <span className="text-13 font-normal text-n-52">
      No orders yet — be the first.
    </span>
  ) : view.preview.feasible ? (
    <>
      {formatInj(view.preview.clearingPrice)}
      <span className="ml-2 text-13 font-normal text-n-52">
        test INJ · {String(view.preview.winnerCount)} orders in
      </span>
    </>
  ) : (
    <span className="text-13 font-normal text-n-52">
      No tier reaches its MOQ yet.
    </span>
  );

  let estimate: string | null = null;
  if (parsed.wei !== null && !myOrder) {
    if (view.preview.feasible) {
      estimate =
        parsed.wei >= view.preview.clearingPrice
          ? `If the current preview holds, you claim back ${formatInj(
              parsed.wei - view.preview.clearingPrice,
            )} test INJ after clearing.`
          : `Below the current clearing preview (${formatInj(
              view.preview.clearingPrice,
            )} test INJ) — outbid → full refund.`;
    } else {
      estimate =
        "No tier reaches its MOQ yet — if that holds at the deadline, you claim a full refund.";
    }
  }

  const refundReason = (() => {
    if (!settlement || !myOrder) return null;
    if (!settlement.success) {
      return "The batch did not reach any factory MOQ — your full escrow comes back.";
    }
    if (myOrder.maxPriceWei < settlement.clearingPrice) {
      return "Your max price was below the clearing price — you claim a full refund.";
    }
    if (myOrder.maxPriceWei === settlement.clearingPrice) {
      return "You win at exactly your max price — no refund due; marking claimed closes your receipt.";
    }
    return "You win at one uniform clearing price — the difference above it comes back.";
  })();

  const claimButtonState = (action: ClaimAction) =>
    claimFeedback?.action === action
      ? claimFeedback.kind === "pending"
        ? "loading"
        : claimFeedback.kind === "confirmed"
          ? "success"
          : "error"
      : "idle";

  // --- render -----------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Status card */}
      <section className="surface flex flex-col gap-4 p-5" aria-label="Batch status">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {view.source === "onchain" ? (
              <SourceTag tone="onchain">Onchain</SourceTag>
            ) : (
              <SourceTag tone="offchain">Off-chain demo</SourceTag>
            )}
            <SourceTag tone="testnet">Testnet</SourceTag>
          </div>
          <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-64">
            {campaignStateName(view.state)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>
            {settled
              ? "Batch status"
              : expired
                ? "Deadline reached"
                : "Time to deadline"}
          </span>
          <span
            className="num text-28 leading-none font-medium text-n-92"
            role="timer"
          >
            {settled
              ? campaignStateName(view.state)
              : expired
                ? "Ended"
                : countdown.label}
          </span>
        </div>

        <div className="line" />

        <dl className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <dt className={LABEL_CLASS}>Orders escrowed</dt>
            <dd className="num text-15 font-medium text-n-92">
              {view.ordersLength}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className={LABEL_CLASS}>
              {settled ? "Clearing price" : "Clearing preview"}
            </dt>
            <dd className="num text-right text-15 font-medium text-n-92">
              {clearingCell}
            </dd>
          </div>
        </dl>

        <p className="flex items-center gap-2 text-13 text-n-64">
          <Lock size={14} className="shrink-0 text-n-40" aria-hidden="true" />
          Every wallet can place 1 order · full escrow.
        </p>
      </section>

      {showClaims && settlement ? (
        /* Claims card — replaces the order flow once the batch is settled. */
        <section className="surface flex flex-col gap-5 p-5" aria-label="Claims">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-17 font-medium text-n-92">
              Claims
            </h2>
            {connected && address ? (
              <CopyValue value={address} display={shortenAddress(address)} />
            ) : null}
          </div>

          <p className="text-13 leading-relaxed text-n-64">
            {settlement.success
              ? `The batch cleared at one uniform price — ${formatInj(
                  settlement.clearingPrice,
                )} test INJ — with ${String(settlement.winnerCount)} winning orders.`
              : "No factory tier reached its MOQ, so every order claims a full refund."}
          </p>

          <div className="line" />

          {!connected ? (
            <ConnectBlock
              connecting={connecting}
              onConnect={onConnect}
              note="Connect the wallet you ordered with to claim your refund."
            />
          ) : isWrongNetwork ? (
            <WrongNetworkBlock switching={switching} onSwitch={onSwitchNetwork} />
          ) : (
            <div className="flex flex-col gap-5">
              {myOrder && refundWei !== null ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={LABEL_CLASS}>Your refund</span>
                    <span className="num text-21 font-medium text-n-92">
                      {formatInj(refundWei)}
                      <span className="ml-1 text-13 font-normal text-n-52">
                        test INJ
                      </span>
                    </span>
                  </div>
                  {refundReason ? (
                    <p className="text-13 leading-relaxed text-n-64">
                      {refundReason}
                    </p>
                  ) : null}
                  {myOrder.refundClaimed ? (
                    <Button variant="ghost" className="w-full" disabled>
                      {refundWei === 0n
                        ? "Marked as claimed"
                        : "Refund claimed"}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      state={claimButtonState("claimRefund")}
                      disabled={claimFeedback?.kind === "pending"}
                      onClick={() => runClaim("claimRefund")}
                    >
                      {refundWei === 0n
                        ? "No refund due · mark as claimed"
                        : `Claim ${formatInj(refundWei)} test INJ`}
                    </Button>
                  )}
                  <TxFeedback feedback={claimFeedback} action="claimRefund" />
                </div>
              ) : !isSelectedFactory ? (
                <p className="text-13 leading-relaxed text-n-64">
                  This wallet has no order in the batch — nothing to claim.
                </p>
              ) : null}

              {isSelectedFactory ? (
                <div className="flex flex-col gap-3">
                  {myOrder ? <div className="line" /> : null}
                  <div className="flex items-center justify-between gap-3">
                    <span className={LABEL_CLASS}>Factory payout</span>
                    <SourceTag tone="factory">Demo factory</SourceTag>
                  </div>
                  <p className="num text-21 font-medium text-n-92">
                    {formatInj(settlement.factoryReceivable)}
                    <span className="ml-1 text-13 font-normal text-n-52">
                      test INJ
                    </span>
                  </p>
                  <p className="text-13 leading-relaxed text-n-64">
                    This wallet is the selected factory — the receivable is
                    winner count × clearing price.
                  </p>
                  {settlement.factoryPayoutClaimed ? (
                    <Button variant="ghost" className="w-full" disabled>
                      Payout claimed
                    </Button>
                  ) : (
                    <Button
                      variant="dark"
                      className="w-full"
                      state={claimButtonState("claimPayout")}
                      disabled={claimFeedback?.kind === "pending"}
                      onClick={() => runClaim("claimPayout")}
                    >
                      {`Claim payout · ${formatInj(
                        settlement.factoryReceivable,
                      )} test INJ`}
                    </Button>
                  )}
                  <TxFeedback feedback={claimFeedback} action="claimPayout" />
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : (
        /* Order card — connect / wrong network / your order / order form. */
        <section
          className="surface flex flex-col gap-5 p-5"
          aria-label="Back this batch"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-17 font-medium text-n-92">
              Back this batch
            </h2>
            {connected && address ? (
              <CopyValue value={address} display={shortenAddress(address)} />
            ) : null}
          </div>

          {!canWrite ? (
            <div className="flex flex-col gap-3" role="status">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={15}
                  className="mt-0.5 shrink-0 text-n-40"
                  aria-hidden="true"
                />
                <p className="text-13 leading-relaxed text-n-64">
                  Live campaign data is unreachable, so ordering and claims are
                  paused. The numbers on this panel right now are cached demo
                  data.
                </p>
              </div>
              <SourceTag tone="offchain">Off-chain demo</SourceTag>
            </div>
          ) : !connected ? (
            <ConnectBlock
              connecting={connecting}
              onConnect={onConnect}
              note="Connect a wallet to escrow your max price — one order per wallet, locked until the batch clears."
            />
          ) : isWrongNetwork ? (
            <WrongNetworkBlock switching={switching} onSwitch={onSwitchNetwork} />
          ) : myOrder ? (
            <div className="flex flex-col gap-4">
              {orderPhase.kind === "success" ? (
                <div
                  className="surface-flat flex flex-col gap-2 p-3"
                  role="status"
                >
                  <p className="flex items-center gap-2 text-13 font-medium text-signal-onchain">
                    <Check size={14} aria-hidden="true" />
                    Order confirmed — escrow locked
                  </p>
                  <ExplorerLink tx={orderPhase.hash}>
                    View transaction
                  </ExplorerLink>
                </div>
              ) : null}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={LABEL_CLASS}>Your order</span>
                  <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-signal-onchain">
                    Locked in escrow
                  </span>
                </div>
                <p className="num text-28 leading-none font-medium text-n-92">
                  {formatInj(myOrder.maxPriceWei)}
                  <span className="ml-2 text-13 font-normal text-n-52">
                    test INJ max
                  </span>
                </p>
                {myOrderTxHash && orderPhase.kind !== "success" ? (
                  <ExplorerLink tx={myOrderTxHash}>
                    Order transaction
                  </ExplorerLink>
                ) : null}
                <p className="text-13 leading-relaxed text-n-64">
                  One order per wallet — it cannot be cancelled or changed.
                  After the deadline the batch clears at one uniform price and
                  any refund opens here.
                </p>
              </div>
            </div>
          ) : orderPhase.kind === "form" ? (
            /* Order form — max price + acknowledgements, then the review step. */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="pledge-max-price" className={LABEL_CLASS}>
                  Your max price · test INJ
                </label>
                <input
                  id="pledge-max-price"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="0.019"
                  aria-invalid={parsed.error !== null}
                  className="w-full rounded-[2px] border border-n-30 bg-n-00 px-3 py-2.5 font-mono text-17 text-n-92 placeholder:text-n-40"
                />
                {parsed.error ? (
                  <p className="text-13 text-danger" role="alert">
                    {parsed.error}
                  </p>
                ) : null}
              </div>

              <div className="flex gap-2" aria-label="Quick price picks">
                {QUICK_PRICES.map((price) => (
                  <button
                    key={price}
                    type="button"
                    aria-pressed={maxPrice.trim() === price}
                    onClick={() => setMaxPrice(price)}
                    className={`flex-1 rounded-[2px] border px-2 py-1.5 font-mono text-13 transition-colors ${
                      maxPrice.trim() === price
                        ? "border-azure text-azure"
                        : "border-n-30 text-n-64 hover:border-n-40 hover:text-n-92"
                    }`}
                  >
                    {price}
                  </button>
                ))}
              </div>

              <p className="text-13 leading-relaxed text-n-64">
                You lock your max price in the contract now. If the uniform
                clearing price is lower, you claim back the difference. If the
                batch fails or you are outbid, you claim a full refund.
              </p>

              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 text-13 leading-relaxed text-n-64">
                  <input
                    type="checkbox"
                    checked={confirmNoCancel}
                    onChange={(event) =>
                      setConfirmNoCancel(event.target.checked)
                    }
                    className="mt-0.5 size-4 shrink-0 accent-azure"
                  />
                  <span>
                    I understand this order cannot be cancelled or changed.
                  </span>
                </label>
                <label className="flex items-start gap-3 text-13 leading-relaxed text-n-64">
                  <input
                    type="checkbox"
                    checked={confirmPublic}
                    onChange={(event) => setConfirmPublic(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-azure"
                  />
                  <span>
                    My wallet address and max price will be public on Injective
                    testnet.
                  </span>
                </label>
              </div>

              {insufficientBalance &&
              balanceWei !== null &&
              parsed.wei !== null &&
              address ? (
                <FaucetCard
                  address={address}
                  balanceWei={balanceWei}
                  maxPriceWei={parsed.wei}
                  rechecking={recheckingBalance}
                  note={faucetNote}
                  onRecheck={recheckBalance}
                />
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={!formReady}
                  onClick={() => setOrderPhase({ kind: "review" })}
                >
                  {parsed.wei !== null
                    ? `Review order · ${formatInj(parsed.wei)} test INJ`
                    : "Back this batch"}
                </Button>
              )}

              {estimate ? (
                <p
                  className="num text-13 leading-relaxed text-n-52"
                  aria-live="polite"
                >
                  {estimate}
                </p>
              ) : null}

              {!isOpen || expired ? (
                <p className="text-11 leading-relaxed text-n-40">
                  {!isOpen
                    ? "The campaign is not open for orders yet."
                    : "The deadline has passed — this batch is waiting for settlement."}
                </p>
              ) : null}
            </div>
          ) : (
            /* Review step — the summary between the two checkboxes and the
               wallet prompt (FR-BUY-02): SKU, max price, uniform-price rule,
               no-cancel, publicity, and the refund estimate. */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className={LABEL_CLASS}>Review your order</span>
                <button
                  type="button"
                  disabled={orderPhase.kind === "pending"}
                  onClick={() => setOrderPhase({ kind: "form" })}
                  className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-azure transition-colors hover:text-azure-deep disabled:text-n-40"
                >
                  Edit
                </button>
              </div>

              <dl className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className={`${LABEL_CLASS} shrink-0`}>Item</dt>
                  <dd className="text-right text-13 font-medium text-n-92">
                    FRAME-01 · Black 8L Modular Camera Sling Bag
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className={`${LABEL_CLASS} shrink-0`}>Your max price</dt>
                  <dd className="num text-right text-15 font-medium text-n-92">
                    {parsed.wei !== null ? formatInj(parsed.wei) : "—"}
                    <span className="ml-1 text-13 font-normal text-n-52">
                      test INJ · escrowed in full now
                    </span>
                  </dd>
                </div>
              </dl>

              <ul className="flex flex-col gap-2">
                {[
                  "You pay the uniform clearing price, never more than your max.",
                  "This order cannot be cancelled or changed.",
                  "Your wallet address and max price will be public on Injective testnet.",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2 text-13 leading-relaxed text-n-64"
                  >
                    <span
                      className="mt-[7px] size-1.5 shrink-0 bg-n-40"
                      aria-hidden="true"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {estimate ? (
                <p
                  className="num text-13 leading-relaxed text-n-52"
                  aria-live="polite"
                >
                  {estimate}
                </p>
              ) : null}

              {insufficientBalance &&
              balanceWei !== null &&
              parsed.wei !== null &&
              address ? (
                <FaucetCard
                  address={address}
                  balanceWei={balanceWei}
                  maxPriceWei={parsed.wei}
                  rechecking={recheckingBalance}
                  note={faucetNote}
                  onRecheck={recheckBalance}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    state={
                      orderPhase.kind === "pending"
                        ? "loading"
                        : orderPhase.kind === "error"
                          ? "error"
                          : "idle"
                    }
                    disabled={!formReady}
                    onClick={submitOrder}
                  >
                    {orderPhase.kind === "pending"
                      ? "Confirm in wallet…"
                      : parsed.wei !== null
                        ? `Confirm and lock ${formatInj(parsed.wei)} test INJ`
                        : "Confirm order"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    disabled={orderPhase.kind === "pending"}
                    onClick={() => setOrderPhase({ kind: "form" })}
                  >
                    Back to edit
                  </Button>
                </div>
              )}

              {orderPhase.kind === "error" ? (
                <p className="text-13 text-danger" role="alert">
                  {orderPhase.message}
                </p>
              ) : null}

              {!isOpen || expired ? (
                <p className="text-11 leading-relaxed text-n-40">
                  {!isOpen
                    ? "The campaign is not open for orders yet."
                    : "The deadline has passed — this batch is waiting for settlement."}
                </p>
              ) : null}
            </div>
          )}
        </section>
      )}

      <p className="px-1 font-mono text-11 leading-relaxed text-n-40">
        Testnet INJ has no value. Hackathon scaled test data.
      </p>
    </div>
  );
}
