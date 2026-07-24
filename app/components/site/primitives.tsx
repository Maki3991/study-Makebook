"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import type { Address, Hex } from "viem";
import { explorerAddressUrl, explorerTxUrl } from "@/app/lib/chain/chain";
import { useCountdown } from "@/app/lib/chain/use-campaign";
import { shortenAddress } from "@/app/lib/chain/wallet";
import { useLang } from "@/app/lib/i18n";

/**
 * Site primitives for the MAKEBOOK campaign pages.
 * Styling hooks live in app/globals.css (.tag / .btn / .num / .skeleton …);
 * components here compose them with the chain-layer helpers.
 */

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** "0x12345678…abcdef" style middle truncation (display only). */
export function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

// ---------------------------------------------------------------------------
// SourceTag — provenance label: 6px square dot + uppercase mono text
// ---------------------------------------------------------------------------

export type SourceTagTone =
  | "onchain"
  | "human"
  | "ai"
  | "factory"
  | "offchain"
  | "testnet";

export function SourceTag({
  tone,
  children,
  className,
}: {
  tone: SourceTagTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("tag", className)} data-tone={tone}>
      <span className="tag-dot" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// SectionHead — kicker / title / intro
// ---------------------------------------------------------------------------

export function SectionHead({
  kicker,
  title,
  intro,
  className,
}: {
  /** Small mono uppercase eyebrow, e.g. "01 / The Product". */
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("flex flex-col gap-3", className)}>
      <p className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
        {kicker}
      </p>
      <h2 className="font-display text-28 leading-[1.25] font-medium text-n-92">
        {title}
      </h2>
      {intro ? (
        <p className="max-w-[640px] text-15 leading-relaxed text-n-64">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Metric — label + large tabular numeral + optional suffix
// ---------------------------------------------------------------------------

export function Metric({
  label,
  value,
  suffix,
  className,
}: {
  label: string;
  /** Pre-formatted display string (wei → formatUnits upstream, never floats). */
  value: ReactNode;
  /** Unit or qualifier rendered small after the value, e.g. "test INJ". */
  suffix?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
        {label}
      </span>
      <span className="num text-28 leading-none font-medium text-n-92">
        {value}
        {suffix ? (
          <span className="ml-2 text-13 font-normal text-n-52">{suffix}</span>
        ) : null}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Countdown — "34 : 25 : 21", flips to "Ended" at the deadline
// ---------------------------------------------------------------------------

export function Countdown({
  deadline,
  className,
  endedLabel,
}: {
  /** Seconds-level Unix timestamp; null renders the "-- : -- : --" placeholder. */
  deadline: bigint | number | null;
  className?: string;
  /** Defaults to the localized "Ended" label. */
  endedLabel?: string;
}) {
  const { t } = useLang();
  const seconds = deadline === null ? null : BigInt(deadline);
  const { label, expired } = useCountdown(seconds);
  return (
    <span className={cx("num", className)} role="timer">
      {expired ? (endedLabel ?? t("common.ended")) : label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// CopyValue — truncated mono value, click to copy, Check feedback
// ---------------------------------------------------------------------------

export function CopyValue({
  value,
  display,
  className,
}: {
  /** Full value copied to the clipboard. */
  value: string;
  /** Rendered text; defaults to middle-truncated `value`. */
  display?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const { t } = useLang();

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Non-secure context / denied permission: textarea fallback.
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // Best effort — the visual feedback below still acknowledges intent.
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      title={value}
      aria-label={copied ? t("common.copied") : t("common.copyValue", { value })}
      className={cx(
        "inline-flex min-h-0 min-w-0 items-center gap-2 rounded-sm px-1 font-mono text-13 text-n-64 transition-colors hover:text-n-92",
        className,
      )}
    >
      <span className="truncate">{display ?? truncateMiddle(value)}</span>
      {copied ? (
        <Check size={14} className="shrink-0 text-signal-onchain" />
      ) : (
        <Copy size={14} className="shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ExplorerLink — Blockscout deep link (address or tx) + ExternalLink icon
// ---------------------------------------------------------------------------

export function ExplorerLink({
  address,
  tx,
  children,
  className,
}: {
  /** Campaign / wallet address to link. Ignored when `tx` is set. */
  address?: Address;
  /** Transaction hash to link. */
  tx?: Hex;
  children?: ReactNode;
  className?: string;
}) {
  const href = tx
    ? explorerTxUrl(tx)
    : address
      ? explorerAddressUrl(address)
      : null;
  if (!href) return null;
  const fallback = tx
    ? truncateMiddle(tx)
    : address
      ? shortenAddress(address)
      : null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cx(
        "num inline-flex items-center gap-1.5 text-13 text-azure underline-offset-4 transition-colors hover:text-azure-deep hover:underline",
        className,
      )}
    >
      <span>{children ?? fallback}</span>
      <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export function Spinner({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <LoaderCircle
      size={size}
      className={cx("animate-spin", className)}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Button — primary azure / dark / ghost × idle / loading / success / error
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "dark" | "ghost";
export type ButtonState = "idle" | "loading" | "success" | "error";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** loading disables the button and swaps in a Spinner. */
  state?: ButtonState;
}

export function Button({
  variant = "primary",
  state = "idle",
  disabled,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("btn", `btn-${variant}`, className)}
      data-state={state === "idle" ? undefined : state}
      disabled={disabled || state === "loading"}
      aria-busy={state === "loading" || undefined}
      {...rest}
    >
      {state === "loading" ? <Spinner size={14} /> : null}
      {state === "success" ? (
        <Check size={14} className="shrink-0" aria-hidden="true" />
      ) : null}
      {state === "error" ? (
        <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
