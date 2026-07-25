// spec 009 §4 + §3.2 验收：量纲修复 / 品牌方登场（本地生产构建 :3210）
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3210";
const browser = await chromium.launch({ headless: true, args: ["--no-proxy-server"] });

let failures = 0;
function report(name, missing) {
  if (missing.length === 0) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${name} — MISSING: ${missing.join(" | ")}`);
  }
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// 等链上读真正落地（quotes/orders/preview 任一慢都会推迟表格渲染），再取文本
async function bodyText(route, waitFor, timeoutMs = 60000) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(
      (needle) => document.body.innerText.includes(needle),
      waitFor,
      { timeout: timeoutMs, polling: 500 },
    );
  } catch {
    // 超时也继续，report 会指出缺失项
  }
  await page.waitForTimeout(800);
  // innerText 在折行处插入 \n，归一化后再做子串匹配
  return page.innerText("body").then((t) => t.replace(/\s+/g, " "));
}

// 1. success 页（en）：署名行 + 六列表格 + 原因行 + 排序规则 + 分账条
// 等待标记用 "4 eligible"：orders 事件流（分段 getLogs，较慢）落地后才出现
{
  const text = await bodyText("/campaigns/success", "4 eligible");
  report("C1 byline", [
    "Sold by FRAME LAB", "DEMO BRAND", "0x42a0…3B0a",
  ].filter((n) => !text.includes(n)));
  report("§4.3 table headers", [
    "FACTORY PRICE", "RETAIL PRICE", "RESULT",
  ].filter((n) => !text.includes(n)));
  report("§4.2/§9.2 factory A infeasible", [
    "0.024", "0.03", "Not selected", "2 eligible < MOQ 3 · infeasible",
  ].filter((n) => !text.includes(n)));
  report("§4.3 factory B selected", [
    "0.019", "0.0238", "Selected", "4 eligible ≥ MOQ 3 · most eligible → selected",
  ].filter((n) => !text.includes(n)));
  report("§4.3 tiebreak footer", [
    "Tie-break: highest eligibleCount → lowest factory price → lowest quoteId/tierIndex",
  ].filter((n) => !text.includes(n)));
  report("C2 funds split", [
    "Where every penny goes", "Factory", "Brand", "Platform",
    "80%", "18%", "2%",
    "Per unit, at the current preview clearing price",
    "the platform never holds the brand's or the factory's money",
  ].filter((n) => !text.includes(n)));
  // 供货方不得写死在署名行（只允许表格里出现 Factory A/B）
  report("C1 no hardcoded supplier", ["FACTORY B 供货", "supplied by"].filter((n) => text.includes(n)) );
  await page.screenshot({ path: "visual-snapshots/spec009-success-desktop.png", fullPage: true });
}

// 2. failure 页（en）：两厂均 未中标 + 不可行
{
  const text = await bodyText("/campaigns/failure", "Tie-break");
  report("failure batch both infeasible", [
    "0 eligible < MOQ 3 · infeasible",
  ].filter((n) => !text.includes(n)));
  await page.screenshot({ path: "visual-snapshots/spec009-failure-desktop.png", fullPage: true });
}

// 3. success 页（zh）：词典镜像
{
  await page.evaluate(() => window.localStorage.setItem("makebook-language", "zh"));
  const text = await bodyText("/campaigns/success", "达标 4");
  report("zh mirror", [
    "由 FRAME LAB 发售", "出厂价", "零售价", "结果",
    "达标 2 < MOQ 3 · 不可行",
    "达标 4 ≥ MOQ 3 · 达标数最多 → 中标",
    "排序规则：eligibleCount 最大 → 出厂价低 → quoteId/tierIndex 小",
    "每一分钱去哪了", "每一笔都在清算时链上记账",
  ].filter((n) => !text.includes(n)));
  await page.screenshot({ path: "visual-snapshots/spec009-success-zh-desktop.png", fullPage: true });
  await page.evaluate(() => window.localStorage.setItem("makebook-language", "en"));
}

// 4. success 页 390px：无横向滚动 + 截图目检
{
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mob.newPage();
  await mp.goto(BASE + "/campaigns/success", { waitUntil: "domcontentloaded" });
  try {
    await mp.waitForFunction(
      (needle) => document.body.innerText.includes(needle),
      "4 eligible",
      { timeout: 90000, polling: 500 },
    );
  } catch {}
  await mp.waitForTimeout(800);
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  report("mobile no horizontal overflow", overflow <= 1 ? [] : [`overflow=${overflow}px`]);
  await mp.screenshot({ path: "visual-snapshots/spec009-success-mobile.png", fullPage: true });
  await mob.close();
}

await ctx.close();
await browser.close();
console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
