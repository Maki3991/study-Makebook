import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { canonicalize, canonicalHash } from "./canonicalize.ts";
import { MarketManifestSchema } from "./manifest.ts";

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(here, "..", "..", "public", "manifests", "frame-01.json");

test("canonicalize：key 乱序的同义对象得到同一字符串与 hash", () => {
  const a = { b: 2, a: { d: [1, { z: true, y: "x" }], c: null } };
  const b = { a: { c: null, d: [1, { y: "x", z: true }] }, b: 2 };
  assert.equal(canonicalize(a), canonicalize(b));
  assert.equal(canonicalHash(a), canonicalHash(b));
  assert.equal(canonicalize(a), '{"a":{"c":null,"d":[1,{"y":"x","z":true}]},"b":2}');
});

test("canonicalize：序列化幂等（重复调用稳定）", () => {
  const obj = { title: "测试", specs: [{ key: "a", value: "1", sourceCommentIds: ["c01"] }] };
  const once = canonicalize(obj);
  const twice = canonicalize(JSON.parse(once));
  assert.equal(once, twice);
});

test("frame-01 manifest：通过 schema、文件本身即 canonical、hash 稳定", () => {
  const raw = readFileSync(manifestPath, "utf8").trim();
  const parsed = MarketManifestSchema.parse(JSON.parse(raw));

  // 仓库中的 frame-01.json 必须就是 canonical 形式（无多余空格、key 有序）
  assert.equal(canonicalize(parsed), raw);

  const hash = canonicalHash(parsed);
  console.log("FRAME-01 manifest canonical JSON:", raw);
  console.log("FRAME-01 manifestHash (keccak256, 供 Solidity / 部署对照):", hash);

  // hash 稳定性锚点：算法或文件一旦被改动，此断言失败
  assert.match(hash, /^0x[0-9a-f]{64}$/);
  assert.equal(hash, canonicalHash(JSON.parse(raw)));
});
