import type { ReactNode } from "react";

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
  return (
    <span className="source-tag" data-tone={tone}>
      <span className="source-tag-dot" aria-hidden="true" />
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
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {value}
        {suffix ? <small>{suffix}</small> : null}
      </strong>
    </div>
  );
}
