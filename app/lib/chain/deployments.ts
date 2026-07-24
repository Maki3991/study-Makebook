import type { Address, Hex } from "viem";
import raw from "../../../deployments/injective-testnet.json";

/**
 * 预部署 Campaign 地址簿（接口文档第 8 节）。
 * 数据源：仓库根 deployments/injective-testnet.json，由合约任务回填。
 * 任一 Campaign address 为零地址 → isDemoMode=true，全站数值回落 fixtures
 * （spec 003 第 1 节"合约地址未部署（零地址）时全部数值 → fixtures/*.json"）。
 */

export interface CampaignDeployment {
  address: Address;
  manifestHash: Hex;
  manifestURI: string;
  /** 秒级 Unix 时间，对应合约 uint64 deadline；链上读取返回 bigint，此处为部署元数据 number。 */
  deadline: number;
  /**
   * 主理人地址（可选）：deployments.json 可能未回填；缺省时前端在 onchain
   * 路径下从合约 operator() 实读，fixture 降级时不编造、显示不可用占位。
   */
  operator?: Address;
  /** 部署块高（可选）：事件扫描起点；缺省时回退到近端窗口。 */
  deployBlock?: number;
}

export interface Deployments {
  chainId: number;
  network: string;
  rpc: string;
  explorer: string;
  success: CampaignDeployment;
  failure: CampaignDeployment;
  /** 可选：真实体验场实例，部署完成后由合约任务回填；缺失或零地址时前端隐藏该入口。 */
  playground?: CampaignDeployment;
}

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

export function isZeroAddress(address: Address): boolean {
  return address.toLowerCase() === ZERO_ADDRESS;
}

export const deployments = raw as Deployments;

/** 成功场景 Campaign（fixtures/success.json 对应的链上实例）。 */
export const successDeployment: CampaignDeployment = deployments.success;
/** 失败场景 Campaign（fixtures/failure.json 对应的链上实例）。 */
export const failureDeployment: CampaignDeployment = deployments.failure;

/**
 * Playground 体验场 Campaign：仅当 deployments.json 回填且地址非零时可用，
 * 否则为 null（UI 不展示 playground 入口，请求该场景时回落 fixtures）。
 */
export const playgroundDeployment: CampaignDeployment | null =
  deployments.playground && !isZeroAddress(deployments.playground.address)
    ? deployments.playground
    : null;

/**
 * Demo/fixture 降级开关：success/failure 任一为零地址即视为未部署完成，
 * 前端全部数值回落 fixtures 并标 OFF-CHAIN DEMO。
 */
export const isDemoMode: boolean =
  isZeroAddress(successDeployment.address) || isZeroAddress(failureDeployment.address);
