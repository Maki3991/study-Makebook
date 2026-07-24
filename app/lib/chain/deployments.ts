import deployments from "@/deployments/injective-testnet.json";

export type DeploymentEntry = {
  address: string;
  manifestHash: string;
  manifestURI: string;
  deadline: number;
  deployBlock: number;
};

export type DeploymentsJson = {
  chainId: number;
  network: string;
  rpc: string;
  explorer: string;
  success: DeploymentEntry;
  failure: DeploymentEntry;
  bracelet?: DeploymentEntry | undefined;
};

export const DEPLOYMENTS: DeploymentsJson = deployments as DeploymentsJson;

export function assertValidCampaignAddress(
  key: "success" | "failure",
  entry: DeploymentEntry | undefined,
): asserts entry is DeploymentEntry & { address: `0x${string}` } {
  if (!entry) {
    throw new Error(`Deployment missing for campaign "${key}". Check deployments/injective-testnet.json.`);
  }
  if (!entry.address || entry.address === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      `Campaign "${key}" has a zero address in deployments/injective-testnet.json. ` +
        `Run the deployment script and refill the address before starting the dev server.`,
    );
  }
}

export function isDeployed(entry: DeploymentEntry | undefined): entry is DeploymentEntry {
  return !!entry && entry.address !== "0x0000000000000000000000000000000000000000";
}
