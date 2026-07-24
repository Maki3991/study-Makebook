import { createPublicClient, http, parseAbi, parseEventLogs } from "viem";
import { canonicalHash } from "../lib/schema/canonicalize.mjs";
import { MarketManifestSchema } from "../lib/schema/manifest.mjs";

const rpc = "https://k8s.testnet.json-rpc.injective.network/";
const client = createPublicClient({ transport: http(rpc) });

const campaignAbi = parseAbi([
  "function state() view returns (uint8)",
  "function ordersLength() view returns (uint256)",
  "function previewSettlement() view returns (bool feasible, uint256 quoteId, uint256 tierIndex, uint256 clearingPrice, uint256 winnerCount)",
  "function getOrder(address buyer) view returns ((address buyer, bytes32 variantHash, uint256 maxPriceWei, bool refundClaimed))",
  "function manifestHash() view returns (bytes32)",
  "event OrderPlaced(address indexed buyer, uint256 maxPrice, bytes32 variantHash)",
]);

async function fetchEvents(address, deployBlock) {
  const latest = await client.getBlockNumber();
  const chunkSize = 5000n;
  const allLogs = [];
  for (let start = BigInt(deployBlock); start <= latest; start += chunkSize) {
    const end = start + chunkSize - 1n > latest ? latest : start + chunkSize - 1n;
    const logs = await client.getLogs({
      address,
      event: {
        type: "event",
        name: "OrderPlaced",
        inputs: [
          { type: "address", name: "buyer", indexed: true },
          { type: "uint256", name: "maxPrice" },
          { type: "bytes32", name: "variantHash" },
        ],
      },
      fromBlock: start,
      toBlock: end,
    });
    allLogs.push(...logs);
  }
  const parsed = parseEventLogs({ abi: campaignAbi, eventName: "OrderPlaced", logs: allLogs });
  return parsed.map((log) => ({ buyer: log.args.buyer, maxPrice: log.args.maxPrice }));
}

async function fetchOrders(address, events) {
  const unique = Array.from(new Set(events.map((e) => e.buyer)));
  const results = await Promise.all(
    unique.map(async (buyer) => {
      try {
        const r = await client.readContract({
          address,
          abi: campaignAbi,
          functionName: "getOrder",
          args: [buyer],
        });
        return { buyer: r[0], maxPriceWei: r[2], refundClaimed: r[3] };
      } catch (err) {
        if (err?.cause?.data?.errorName === "NoOrder") return null;
        throw err;
      }
    }),
  );
  return results.filter(Boolean);
}

async function checkManifest(path, onChainHash) {
  const res = await fetch(`http://localhost:3000${path}`);
  const raw = await res.json();
  const manifest = MarketManifestSchema.parse(raw);
  const hash = canonicalHash(manifest);
  return { hash, hashOk: hash.toLowerCase() === onChainHash.toLowerCase(), title: manifest.title };
}

const success = {
  address: "0x378bb7d08e92317ff8a5f7750bb7a91332bab03d",
  deployBlock: 134529577,
};
const failure = {
  address: "0x01c51b7c50dd0537933bf245b8a5ea6252735f51",
  deployBlock: 134533159,
};

console.log("=== Events + getOrder (success) ===");
const successEvents = await fetchEvents(success.address, success.deployBlock);
console.log("OrderPlaced events:", successEvents.length);
const successOrders = await fetchOrders(success.address, successEvents);
console.log("getOrder results:", successOrders.length);
console.log(successOrders.map((o) => `${o.buyer}: ${Number(o.maxPriceWei) / 1e18}`));

console.log("\n=== Events + getOrder (failure) ===");
const failureEvents = await fetchEvents(failure.address, failure.deployBlock);
console.log("OrderPlaced events:", failureEvents.length);
const failureOrders = await fetchOrders(failure.address, failureEvents);
console.log("getOrder results:", failureOrders.length);

console.log("\n=== Manifest validation ===");
const successOnChain = await client.readContract({
  address: success.address,
  abi: campaignAbi,
  functionName: "manifestHash",
});
const frameManifest = await checkManifest("/manifests/frame-01.json", successOnChain);
console.log("FRAME-01:", frameManifest);
