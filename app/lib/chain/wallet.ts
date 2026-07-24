"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  createWalletClient,
  custom,
  parseEventLogs,
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
 * - settle / claimRefund / claimPayout / placeOrder 写操作 + custom error → PRD 15 人话
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

/**
 * 触发钱包连接（eth_requestAccounts），返回授权账户列表；
 * 未检测到钱包时返回空数组，用户拒绝授权时抛错（由调用方决定提示或降级）。
 */
export async function requestAccounts(): Promise<Address[]> {
  const ethereum = getEthereum();
  if (!ethereum) return [];
  return ethereum.request<Address[]>({ method: "eth_requestAccounts" });
}

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
      const accounts = await requestAccounts();
      let chainIdHex = await ethereum.request<string>({ method: "eth_chainId" });
      // 连接后不在目标网络时自动请求一键切换（用户可拒绝，仍回退到错网提示）。
      if (Number.parseInt(chainIdHex, 16) !== INJECTIVE_EVM_TESTNET_CHAIN_ID) {
        try {
          await switchToInjectiveNetwork();
          chainIdHex = await ethereum.request<string>({ method: "eth_chainId" });
        } catch {
          // 用户拒绝切换：保持错网状态，由界面的一键切换按钮接管。
        }
      }
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

/** placeOrder 交易确认后的成功凭证（接口文档第 4 节：解码 OrderPlaced 事件）。 */
export interface PlaceOrderResult {
  hash: Hex;
  orderPlaced: {
    buyer: Address;
    /** 买家最高愿付价（wei），等于 msg.value。 */
    maxPrice: bigint;
    variantHash: Hex;
  };
}

/**
 * 真实下单：placeOrder(variantHash, maxPrice) payable（接口文档 2.1）。
 * - variantHash 取 Campaign 的 manifestHash（view/deployments）
 * - msg.value 严格等于 maxPriceWei，否则合约 revert InvalidPayment
 * - 回执确认后从 logs 解码 OrderPlaced 作为成功凭证；解码不到视为未下单并抛错
 * revert / 用户拒签以异常抛出，由 describePlaceOrderError 翻译。
 */
export async function placeOrder(
  campaign: Address,
  account: Address,
  variantHash: Hex,
  maxPriceWei: bigint,
): Promise<PlaceOrderResult> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("未检测到钱包（window.ethereum 不存在）");
  const walletClient = createWalletClient({
    chain: injectiveEvmTestnet,
    transport: custom(ethereum),
  });
  const hash = await walletClient.writeContract({
    address: campaign,
    abi: makebookAbi,
    functionName: "placeOrder",
    args: [variantHash, maxPriceWei],
    value: maxPriceWei,
    account,
    chain: injectiveEvmTestnet,
  });
  const publicClient = createInjPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const orderPlacedLogs = parseEventLogs({
    abi: makebookAbi,
    eventName: "OrderPlaced",
    logs: receipt.logs,
  });
  const event = orderPlacedLogs[0];
  if (!event) {
    throw new Error("交易已确认，但回执中未解码到 OrderPlaced 事件。");
  }
  return {
    hash,
    orderPlaced: {
      buyer: event.args.buyer,
      maxPrice: event.args.maxPrice,
      variantHash: event.args.variantHash,
    },
  };
}

/** placeOrder 语境的 custom error → PRD 15 人话（接口文档 2.1 placeOrder 行）。 */
const PLACE_ORDER_REVERT_MESSAGES: Record<string, string> = {
  CampaignNotOpen: "Campaign 未开放，暂不能下单。",
  DeadlinePassed: "已截止，本批次停止接单。",
  InvalidPayment: "金额不符：支付金额必须严格等于最高愿付价且大于 0。",
  DuplicateOrder: "你已在当前 Campaign 下过单，每个钱包限 1 单。",
  OrderLimitReached: "本批次 50 单已满。",
};

/**
 * 下单异常 → 用户可读文案：优先 placeOrder 语境的 custom error，
 * 其次用户拒签（PRD 15 原文），最后回落通用写错误翻译。
 */
export function describePlaceOrderError(err: unknown): string {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const errorName = revert.data?.errorName;
      if (errorName && PLACE_ORDER_REVERT_MESSAGES[errorName]) {
        return PLACE_ORDER_REVERT_MESSAGES[errorName];
      }
    }
    const rejected = err.walk((e) => e instanceof UserRejectedRequestError);
    if (rejected instanceof UserRejectedRequestError) {
      return "你取消了钱包签名；没有创建订单，也没有资金进入合约。";
    }
  }
  return describeWriteError(err);
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
