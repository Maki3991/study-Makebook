import { test } from "node:test";
import assert from "node:assert/strict";
import { redact, REDACTED_EMAIL, REDACTED_PHONE, REDACTED_ADDRESS } from "./redact.ts";
import { compileComments, type CommentInput } from "./compile.ts";
import { FIXTURE_RESULT } from "./fixture.ts";
import { CompileResultSchema } from "../schema/manifest.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

test("redact：邮箱、手机号、地址片段替换为占位符", () => {
  const input =
    "联系我 alice@example.com 或 13812345678，地址：浙江省杭州市西湖区文三路100号，包不错";
  const out = redact(input);
  assert.ok(!out.includes("alice@example.com"));
  assert.ok(!out.includes("13812345678"));
  assert.ok(!out.includes("文三路100号"));
  assert.ok(out.includes(REDACTED_EMAIL));
  assert.ok(out.includes(REDACTED_PHONE));
  assert.ok(out.includes(REDACTED_ADDRESS));
  assert.ok(out.includes("包不错")); // 正常内容不动
});

test("redact：价格区间不被误伤", () => {
  const input = "220-260 这个区间都合理，250 左右我会下单";
  assert.equal(redact(input), input);
});

test("fixture：输出本身通过 CompileResultSchema", () => {
  assert.doesNotThrow(() => CompileResultSchema.parse(FIXTURE_RESULT));
  assert.equal(FIXTURE_RESULT.candidates.length, 3);
});

test("compile：无 API key 时 2 秒内降级 fixture 并标记", async () => {
  const comments: CommentInput[] = JSON.parse(
    readFileSync(join(here, "..", "..", "fixtures", "comments.json"), "utf8"),
  );
  const started = Date.now();
  const out = await compileComments(comments, { timeoutMs: 2000 });
  const elapsed = Date.now() - started;
  assert.equal(out.fixture, true);
  assert.ok(elapsed < 2000, `fixture 降级应 < 2s，实际 ${elapsed}ms`);
  assert.equal(out.result.schemaVersion, "makebook.compile.v1");
  assert.ok(out.error); // 说明降级原因
});

test("compile：FR-AI-01 统计空行与重复项（20 条含 2 重复 → 18 有效）", async () => {
  const comments: CommentInput[] = JSON.parse(
    readFileSync(join(here, "..", "..", "fixtures", "comments.json"), "utf8"),
  );
  const out = await compileComments(comments);
  assert.equal(out.stats.total, 20);
  assert.equal(out.stats.duplicates, 2);
  assert.equal(out.stats.empty, 0);
  assert.equal(out.stats.valid, 18);
});

test("compile：空输入直接返回 fixture", async () => {
  const out = await compileComments([]);
  assert.equal(out.fixture, true);
  assert.equal(out.stats.valid, 0);
});
