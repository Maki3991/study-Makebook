// Track C 新元素 + P1 回归：对本地生产构建（wrangler dev :8788）做浏览器实测
// 用法：PATH="/opt/homebrew/bin:$PATH" node scripts/trackc-check.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:8788";
const browser = await chromium.launch({ headless: true, args: ["--no-proxy-server"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

let failures = 0;
function report(name, missing) {
  if (missing.length === 0) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${name} — MISSING: ${missing.join(" | ")}`);
  }
}

async function bodyText(route, waitMs = 12000) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(waitMs); // 等 wagmi 链上读 + hydrate
  return page.innerText("body");
}

// 1. 首页：实况条四格 + 顶栏 Console 入口（P1 数据锚点：3 批次 / 7 单 / 0.187 托管）
{
  const text = await bodyText("/", 25000); // escrow 走分段 getLogs，网络慢时多等
  report("home ticker+nav", [
    "BATCHES LIVE", "TOTAL ORDERS", "ESCROWED", "UNTIL DEADLINE",
    "3", "7", "0.187", "Console",
  ].filter((n) => !text.includes(n)));
  await page.screenshot({ path: "visual-snapshots/trackc-home-desktop.png", fullPage: true });
}

// 2. success 页：证据区块 + 曲线清算标注 + trust panel 开关 + P1 回归
{
  const text = await bodyText("/campaigns/success");
  report("campaign success evidence+P1", [
    "0x260A9C9075B09B5950385fEB1AEa7d83a25E556e", // 合约地址
    "0xd4f9…abc1", // 部署 tx 截断（truncateAddress: 前 6…后 4）
    "Uniform price", // 曲线清算标注
    "0.0238", // 零售清算价
    "0.020", "0.024", "0.030", // chips
  ].filter((n) => !text.includes(n)));
  // 活动流：买家截断地址 0x… 形式至少一行
  const hasActivity = /0x[0-9a-fA-F]{4}…[0-9a-fA-F]{4}/.test(text) || /0x[0-9a-fA-F]{4}\.\.\.[0-9a-fA-F]{4}/.test(text);
  report("campaign success activity stream", hasActivity ? [] : ["buyer-row"]);
  // trust panel：点击 toggle 展开，四段内容出现
  const toggle = page.locator("button", { hasText: /hash|Hash|trust|Trust|verification|Verification|校验|验证/ }).first();
  if (await toggle.count()) {
    await toggle.click();
    await page.waitForTimeout(800);
    const expanded = await page.innerText("body");
    report("trust panel expand", ["Canonical", "0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec"]
      .filter((n) => !expanded.includes(n)));
  } else {
    report("trust panel expand", ["toggle-button"]);
  }
  await page.screenshot({ path: "visual-snapshots/trackc-success-desktop.png", fullPage: true });
}

// 3. failure/bracelet 页：新地址回归
for (const [route, addr] of [
  ["/campaigns/failure", "0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9"],
  ["/campaigns/bracelet", "0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691"],
]) {
  const text = await bodyText(route);
  report(`${route} address`, text.includes(addr) ? [] : [addr]);
}

// 4. console 页：角色条 + 编译台 + 监控表渲染（guest 视角也应可见后两者）
{
  const text = await bodyText("/console");
  report("console renders", ["Console", "工作台"].some((n) => text.includes(n)) ? [] : ["title"]);
  await page.screenshot({ path: "visual-snapshots/trackc-console-desktop.png", fullPage: true });
}

await browser.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
