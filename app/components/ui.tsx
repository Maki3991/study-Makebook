"use client";

import NumberFlow from "@number-flow/react";
import {
  BadgeCheck,
  Check,
  CircleDashed,
  Copy,
  ExternalLink,
  Factory,
  FlaskConical,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type SourceTagTone =
  | "onchain"
  | "ai"
  | "human"
  | "factory"
  | "offchain"
  | "testnet";

export function SourceTag({
  tone,
  children,
}: {
  tone: SourceTagTone;
  children: ReactNode;
}) {
  const Icon = {
    onchain: BadgeCheck,
    ai: Sparkles,
    human: UserCheck,
    factory: Factory,
    offchain: CircleDashed,
    testnet: FlaskConical,
  }[tone];

  return (
    <span className="source-tag" data-tone={tone}>
      <Icon className="source-tag-icon" size={11} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </span>
  );
}

export function SectionLabel({
  index,
  children,
  aside,
}: {
  index: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="section-label">
      <span>
        {index} / {children}
      </span>
      {aside ? <span>{aside}</span> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  const numericValue = Number(value);
  const decimals = value.includes(".") ? value.split(".")[1]?.length ?? 0 : 0;

  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {Number.isFinite(numericValue) ? (
          <NumberFlow
            className="number-flow"
            value={numericValue}
            format={{
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }}
            transformTiming={{
              duration: 520,
              easing: "cubic-bezier(.2,.8,.2,1)",
            }}
            spinTiming={{
              duration: 520,
              easing: "cubic-bezier(.2,.8,.2,1)",
            }}
          />
        ) : (
          value
        )}
        {suffix ? <small>{suffix}</small> : null}
      </strong>
    </div>
  );
}

export function AnimatedAmount({
  value,
  decimals = 3,
}: {
  value: number;
  decimals?: number;
}) {
  return (
    <NumberFlow
      className="number-flow"
      value={value}
      format={{
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }}
      transformTiming={{
        duration: 520,
        easing: "cubic-bezier(.2,.8,.2,1)",
      }}
      spinTiming={{
        duration: 520,
        easing: "cubic-bezier(.2,.8,.2,1)",
      }}
    />
  );
}

export function CopyValue({
  value,
  display,
  label = "复制完整值",
}: {
  value: string;
  display: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="copy-value" type="button" onClick={copy} aria-label={label}>
      <span>{display}</span>
      {copied ? (
        <Check size={13} aria-hidden="true" />
      ) : (
        <Copy size={13} aria-hidden="true" />
      )}
    </button>
  );
}

export function ExplorerLink({
  hash,
  display,
  label,
}: {
  hash: string;
  display: string;
  label: string;
}) {
  return (
    <a
      className="explorer-link"
      href={`https://testnet.blockscout.injective.network/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label}：在 Injective Blockscout 查看交易`}
    >
      <span>{display}</span>
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

export function WeiDebug({
  amount,
  wei,
}: {
  amount: string;
  wei: string;
}) {
  return (
    <details className="wei-debug">
      <summary>wei / debug</summary>
      <div>
        <span>{amount} test INJ</span>
        <code>{wei} wei</code>
      </div>
    </details>
  );
}
