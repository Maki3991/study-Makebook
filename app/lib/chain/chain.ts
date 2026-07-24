import {
  createPublicClient,
  defineChain,
  http,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";

/**
 * Injective EVM Testnet 链配置（接口文档 docs/FRONTEND_INTERFACE.md 第 1 节）。
 * - EVM Chain ID 1439（前端强校验，错误网络一键切换）
 * - Native token INJ，18 decimals，测试网无真实价值
 * - Explorer 为 Blockscout
 */

export const INJECTIVE_EVM_TESTNET_CHAIN_ID = 1439 as const;
export const INJ_DECIMALS = 18 as const;
export const DEFAULT_RPC_URL = "https://k8s.testnet.json-rpc.injective.network/";
export const EXPLORER_BASE_URL = "https://testnet.blockscout.injective.network";

/** NEXT_PUBLIC_INJ_RPC 可覆盖默认 RPC（接口文档第 1 节"支持环境变量覆盖"）。 */
const envRpc = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_INJ_RPC : undefined;
export const rpcUrl = envRpc && envRpc.length > 0 ? envRpc : DEFAULT_RPC_URL;

export const injectiveEvmTestnet = defineChain({
  id: INJECTIVE_EVM_TESTNET_CHAIN_ID,
  name: "Injective EVM Testnet",
  nativeCurrency: { name: "INJ", symbol: "INJ", decimals: INJ_DECIMALS },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: {
    default: { name: "Blockscout", url: EXPLORER_BASE_URL },
  },
  contracts: {
    // 规范 Multicall3 地址已部署于本测试网（实测 eth_getCode 非空）：
    // 用 multicall 合并读调用可显著降低慢 RPC 的往返次数。
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
  testnet: true,
});

/** viem PublicClient 工厂：Injective EVM Testnet + http transport。 */
export function createInjPublicClient(): PublicClient {
  return createPublicClient({
    chain: injectiveEvmTestnet,
    transport: http(rpcUrl),
  });
}

/** Blockscout 地址深链：https://testnet.blockscout.injective.network/address/<0x...> */
export function explorerAddressUrl(address: Address): string {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}

/** Blockscout 交易深链：https://testnet.blockscout.injective.network/tx/<0x...> */
export function explorerTxUrl(txHash: Hex): string {
  return `${EXPLORER_BASE_URL}/tx/${txHash}`;
}
