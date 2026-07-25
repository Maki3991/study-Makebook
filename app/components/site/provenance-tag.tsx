"use client";

import {
  Link2,
  Sparkles,
  UserCheck,
  Factory,
  CloudOff,
  FlaskConical,
  Store,
} from "lucide-react";
import { useCopy } from "@/app/lib/i18n/use-copy";
import type { Copy } from "@/app/lib/i18n/dictionaries";

export type ProvenanceTagType =
  | "ONCHAIN"
  | "AI GENERATED"
  | "HUMAN CONFIRMED"
  | "DEMO FACTORY"
  | "DEMO BRAND"
  | "OFF-CHAIN DEMO"
  | "TESTNET";

// Spec 009 §1.7: the visible text comes from the dictionary (bilingual) —
// the enum value itself is never rendered.
const TAG_CONFIG: Record<
  ProvenanceTagType,
  {
    icon: React.ComponentType<{ size?: number }>;
    className: string;
    copyKey: keyof Copy["provenance"];
  }
> = {
  ONCHAIN: {
    icon: Link2,
    className: "tag-success",
    copyKey: "onchain",
  },
  "AI GENERATED": {
    icon: Sparkles,
    className: "tag-accent",
    copyKey: "aiGenerated",
  },
  "HUMAN CONFIRMED": {
    icon: UserCheck,
    className: "tag-accent",
    copyKey: "humanConfirmed",
  },
  "DEMO FACTORY": {
    icon: Factory,
    className: "tag-warn",
    copyKey: "demoFactory",
  },
  "DEMO BRAND": {
    icon: Store,
    className: "tag-accent",
    copyKey: "demoBrand",
  },
  "OFF-CHAIN DEMO": {
    icon: CloudOff,
    className: "tag-neutral",
    copyKey: "offchainDemo",
  },
  TESTNET: {
    icon: FlaskConical,
    className: "tag-accent",
    copyKey: "testnet",
  },
};

export function ProvenanceTag({
  type,
  className = "",
}: {
  type: ProvenanceTagType;
  className?: string;
}) {
  const copy = useCopy();
  const config = TAG_CONFIG[type];
  const Icon = config.icon;
  return (
    <span className={`tag ${config.className} ${className}`}>
      <Icon size={12} />
      {copy.provenance[config.copyKey]}
    </span>
  );
}
