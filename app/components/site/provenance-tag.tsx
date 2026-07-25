import {
  Link2,
  Sparkles,
  UserCheck,
  Factory,
  CloudOff,
  FlaskConical,
  Store,
} from "lucide-react";

export type ProvenanceTagType =
  | "ONCHAIN"
  | "AI GENERATED"
  | "HUMAN CONFIRMED"
  | "DEMO FACTORY"
  | "DEMO BRAND"
  | "OFF-CHAIN DEMO"
  | "TESTNET";

const TAG_CONFIG: Record<
  ProvenanceTagType,
  {
    icon: React.ComponentType<{ size?: number }>;
    className: string;
  }
> = {
  ONCHAIN: {
    icon: Link2,
    className: "tag-success",
  },
  "AI GENERATED": {
    icon: Sparkles,
    className: "tag-accent",
  },
  "HUMAN CONFIRMED": {
    icon: UserCheck,
    className: "tag-accent",
  },
  "DEMO FACTORY": {
    icon: Factory,
    className: "tag-warn",
  },
  "DEMO BRAND": {
    icon: Store,
    className: "tag-accent",
  },
  "OFF-CHAIN DEMO": {
    icon: CloudOff,
    className: "tag-neutral",
  },
  TESTNET: {
    icon: FlaskConical,
    className: "tag-accent",
  },
};

export function ProvenanceTag({
  type,
  className = "",
}: {
  type: ProvenanceTagType;
  className?: string;
}) {
  const config = TAG_CONFIG[type];
  const Icon = config.icon;
  return (
    <span className={`tag ${config.className} ${className}`}>
      <Icon size={12} />
      {type}
    </span>
  );
}
