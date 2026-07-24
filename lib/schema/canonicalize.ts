import { keccak256, toBytes } from "viem";

/**
 * Canonical JSON（PRD 11.2）：
 *   1. 对象 key 递归按字典序排列；
 *   2. UTF-8 编码，无多余空格（JSON.stringify 默认无空格）；
 *   3. keccak256(bytes(canonicalJson)) 写入合约作为 manifestHash。
 * 前端与部署脚本必须使用同一个 canonicalize（本文件即参考实现，APP-01）。
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

function sortRecursively(value: unknown): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortRecursively);
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, JsonValue> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortRecursively((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value as JsonValue;
}

/** 递归 key 字典序、无多余空格的 canonical JSON 字符串。 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortRecursively(value));
}

/** keccak256(UTF-8 bytes of canonical JSON)，与 Solidity 端 keccak256(bytes(...)) 对齐。 */
export function canonicalHash(value: unknown): `0x${string}` {
  return keccak256(toBytes(canonicalize(value)));
}
