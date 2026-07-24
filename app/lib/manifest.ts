import {
  canonicalHash,
} from "@/lib/schema/canonicalize";
import { MarketManifestSchema, type MarketManifest } from "@/lib/schema/manifest";
import type { CampaignId } from "./types";
import { CAMPAIGNS } from "./chain/config";

export type ManifestResult = {
  manifest: MarketManifest;
  canonicalHash: `0x${string}`;
  onChainHash?: `0x${string}`;
  hashOk: boolean;
};

export async function fetchManifest(
  path: string,
): Promise<{ manifest: MarketManifest; canonicalHash: `0x${string}` }> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch manifest from ${path}: ${res.status}`);
  }
  const raw = await res.json();
  const manifest = MarketManifestSchema.parse(raw);
  return { manifest, canonicalHash: canonicalHash(manifest) };
}

export async function loadCampaignManifest(
  id: CampaignId,
  onChainHash?: `0x${string}`,
): Promise<ManifestResult> {
  const meta = CAMPAIGNS[id];
  const { manifest, canonicalHash: hash } = await fetchManifest(meta.manifestPath);
  return {
    manifest,
    canonicalHash: hash,
    onChainHash,
    hashOk: onChainHash ? hash.toLowerCase() === onChainHash.toLowerCase() : false,
  };
}
