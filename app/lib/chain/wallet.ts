"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  createWalletClient,
  custom,
  type Address,
  type Hex,
} from "viem";
import { makebookAbi } from "./abi";
import {
  EXPLORER_BASE_URL,
  INJECTIVE_EVM_TESTNET_CHAIN_ID,
  createInjPublicClient,
  injectiveEvmTestnet,
  rpcUrl,
} from "./chain";

/**
 * 浏览器钱包（EIP-1193）接入层。
 * - 连接 / 监听账户与网络变化（makebook-app header 的"连接钱包"）
 * - 错误网络一键切换 wallet_switchEthereumChain，未知链回退 wallet_addEthereumChain
 * - settle / claimRefund / claimPayout 写操作 + custom error → PRD 15 人话
 */

/** 最小 EIP-1193 Provider 类型（避免引入钱包库类型依赖）。 */
export interface Eip1193Provider {
  request<T = unknown>(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }): Promise<T>;
  on?(event: string, listener: (...args: never[]) => void): void;
  removeListener?(event: string, listener: (...args: never[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function getEthereum(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

export interface ConnectedWallet {
  address: Address;
  chainId: number;
}

/** 1439 的 0x 前缀十六进制（EIP-3085/3326 参数格式）。 */
const CHAIN_ID_HEX = `0x${INJECTIVE_EVM_TESTNET_CHAIN_ID.toString(16)}`;

/** 已连接钱包状态 + 连接/切链动作。SSR 安全：初始为空，仅在 effect 内触达 window.ethereum。 */
export function useWallet() {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;
    let cancelled = false;

    async function syncAccounts(accounts: Address[]) {
      if (accounts.length === 0) {
        if (!cancelled) setWallet(null);
        return;
      }
      try {
        const chainIdHex = await ethereum!.request<string>({ method: "eth_chainId" });
        if (!cancelled) {
          setWallet({ address: accounts[0], chainId: Number.parseInt(chainIdHex, 16) });
        }
      } catch {
        if (!cancelled) setWallet({ address: accounts[0], chainId: 0 });
      }
    }

    // 已授权过的会话静默恢复，不弹窗。
    ethereum
      .request<Address[]>({ method: "eth_accounts" })
      .then(syncAccounts)
      .catch(() => undefined);

    const onAccountsChanged = (accounts: Address[]) => {
      void syncAccounts(accounts);
    };
    const onChainChanged = (chainIdHex: string) => {
      setWallet((prev) =>
        prev ? { ...prev, chainId: Number.parseInt(chainIdHex, 16) } : prev,
      );
    };
    ethereum.on?.("accountsChanged", onAccountsChanged);
    ethereum.on?.("chainChanged", onChainChanged);
    return () => {
      cancelled = true;
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) return;
    setConnecting(true);
    try {
      const accounts = await ethereum.request<Address[]>({
        method: "eth_requestAccounts",
      });
      const chainIdHex = await ethereum.request<string>({ method: "eth_chainId" });
      if (accounts.length > 0) {
        setWallet({ address: accounts[0], chainId: Number.parseInt(chainIdHex, 16) });
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  return { wallet, connecting, connect };
}

export function shortenAddress(address: Address): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * 一键切到 Injective EVM Testnet（Chain ID 1439）。
 * 钱包未添加该链（4902）时回退 wallet_addEthereumChain（接口文档第 1 节参数）。
 */
export async function switchToInjectiveNetwork(): Promise<void> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("未检测到钱包（window.ethereum 不存在）");
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code !== 4902) throw err;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_ID_HEX,
          chainName: "Injective EVM Testnet",
          nativeCurrency: { name: "INJ", symbol: "INJ", decimals: 18 },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: [EXPLORER_BASE_URL],
        },
      ],
    });
  }
}

export type CampaignWriteAction = "settle" | "claimRefund" | "claimPayout";

/**
 * 通过浏览器钱包发起 Campaign 写交易并等待回执。
 * 回执确认后返回 tx hash；revert / 用户拒签以异常抛出，由 describeWriteError 翻译。
 */
export async function writeCampaignAction(
  action: CampaignWriteAction,
  campaign: Address,
  account: Address,
): Promise<Hex> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("未检测到钱包（window.ethereum 不存在）");
  const walletClient = createWalletClient({
    chain: injectiveEvmTestnet,
    transport: custom(ethereum),
  });
  const hash = await walletClient.writeContract({
    address: campaign,
    abi: makebookAbi,
    functionName: action,
    account,
    chain: injectiveEvmTestnet,
  });
  const publicClient = createInjPublicClient();
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/** custom error → PRD 15 人话（接口文档 2.1 文案映射）。 */
const REVERT_MESSAGES: Record<string, string> = {
  CampaignNotOpen: "清算已完成或尚未开盘。",
  DeadlineNotReached: "还未到清算时间，清算交易未被执行。",
  WrongState: "清算完成后才能领取。",
  NoOrder: "该地址没有订单。",
  AlreadyClaimed: "你已领取过，不能重复领取。",
  NotSelectedFactory: "只有中标工厂地址可以领取。",
  TransferFailed: "转账失败，请重试（你的领取状态未改变）。",
  DuplicateOrder: "你已在当前 Campaign 下过单，每个钱包限 1 单。",
  DeadlinePassed: "已截止，本批次停止接单。",
  InvalidPayment: "金额不符：支付金额必须严格等于最高愿付价且大于 0。",
  OrderLimitReached: "本批次 50 单已满。",
};

/** 写交易异常 → 用户可读文案：优先 custom error，其次用户拒签，最后兜底。 */
export function describeWriteError(err: unknown): string {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const errorName = revert.data?.errorName;
      if (errorName && REVERT_MESSAGES[errorName]) return REVERT_MESSAGES[errorName];
    }
    const rejected = err.walk((e) => e instanceof UserRejectedRequestError);
    if (rejected instanceof UserRejectedRequestError) {
      return "你取消了钱包签名；没有提交任何交易。";
    }
  }
  return "交易失败，请重试。";
}
