import {
  DEPLOYMENTS,
  isDeployed,
  assertValidCampaignAddress,
  type DeploymentEntry,
} from "./deployments";

export const CHAIN_ID = 1439;

export const RPC_URL =
  process.env.NEXT_PUBLIC_INJ_RPC ??
  "https://k8s.testnet.json-rpc.injective.network/";

export const EXPLORER_BASE = "https://testnet.blockscout.injective.network";

export const FAUCET_URL = "https://testnet.faucet.injective.network/";

export const POLL_INTERVAL_MS = 10_000;

export const MAX_ORDERS = 50;

export type CampaignId = "success" | "failure" | "bracelet";

export type CampaignMeta = {
  id: CampaignId;
  product: string;
  batchName: string;
  manifestPath: string;
  heroImage: string;
  route: string;
  manifestHashAnchor: `0x${string}`;
  // Deploy tx hash from the 2026-07-25 P1 deployment run (on-chain fact).
  deployTx: `0x${string}`;
  deployment: DeploymentEntry | undefined;
  deployed: boolean;
};

const REGISTRY_BASE: Omit<CampaignMeta, "deployment" | "deployed">[] = [
  {
    id: "success",
    product: "FRAME-01 Camera Sling",
    batchName: "Batch A",
    manifestPath: "/manifests/frame-01.json",
    heroImage: "/products/frame-01/hero.png",
    route: "/campaigns/success",
    manifestHashAnchor:
      "0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec",
    deployTx:
      "0xd4f94c035f756f3c88f04819f9260fa988a4455058a3599acda49a1b8982abc1",
  },
  {
    id: "failure",
    product: "FRAME-01 Camera Sling",
    batchName: "Batch B",
    manifestPath: "/manifests/frame-01.json",
    heroImage: "/products/frame-01/hero.png",
    route: "/campaigns/failure",
    manifestHashAnchor:
      "0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec",
    deployTx:
      "0xbaca5eee8b34a2de325b2f7801e444b984179bc1f746a923c06abb0cee1c31b8",
  },
  {
    id: "bracelet",
    product: "BRACELET-01 AI Heritage Bracelet",
    batchName: "Batch A",
    manifestPath: "/manifests/heritage-bracelet.json",
    heroImage: "/products/bracelet-01/hero.png",
    route: "/campaigns/bracelet",
    manifestHashAnchor:
      "0x1c503957667bb009a161c7d9bfe70e59db01c61c80920faae60f98a1e3c958dd",
    deployTx:
      "0x8a648d3f44b713205e1aef41f7b7f256e112fbe02ba9d95723c2dbd45d247e32",
  },
];

function buildRegistry(): Record<CampaignId, CampaignMeta> {
  const out = {} as Record<CampaignId, CampaignMeta>;
  for (const base of REGISTRY_BASE) {
    const deployment = DEPLOYMENTS[base.id] as DeploymentEntry | undefined;
    out[base.id] = {
      ...base,
      deployment,
      deployed: isDeployed(deployment),
    };
  }
  return out;
}

export const CAMPAIGNS = buildRegistry();

// Mandatory campaigns must have real addresses. Bracelet is allowed to be pending.
assertValidCampaignAddress("success", CAMPAIGNS.success.deployment);
assertValidCampaignAddress("failure", CAMPAIGNS.failure.deployment);

export const DEPLOYED_CAMPAIGNS: CampaignId[] = (
  ["success", "failure", "bracelet"] as CampaignId[]
).filter((id) => CAMPAIGNS[id].deployed);
