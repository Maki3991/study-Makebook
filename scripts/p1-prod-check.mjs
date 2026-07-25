import { chromium } from "playwright";

const BASE = "https://makebook-frontend.jiachexie6.workers.dev";
// 本机网络劫持 workers.dev，需绕过代理解析出真实 Cloudflare IP；IP 会变，用前刷新：dig +short makebook-frontend.jiachexie6.workers.dev
const CF_IP = process.env.CF_IP ?? "179.60.193.9";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-proxy-server",
    `--host-resolver-rules=MAP makebook-frontend.jiachexie6.workers.dev ${CF_IP}`,
  ],
});
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

const checks = [
  {
    route: "/campaigns/success",
    // 零售清算价链上值为 0.02375，页面 formatInj 只显示 4 位小数 → 0.0238（预期，勿改回 0.02375）
    needles: ["0x260A9C9075B09B5950385fEB1AEa7d83a25E556e", "0.0238", "0.020", "0.024", "0.030"],
    note: "success 页：新地址 + 零售清算价 + 三个 chips",
  },
  { route: "/campaigns/failure", needles: ["0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9"], note: "failure 页：新地址" },
  { route: "/campaigns/bracelet", needles: ["0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691"], note: "bracelet 页：新地址" },
];

for (const { route, needles, note } of checks) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(15000); // 等 wagmi 链上读 +  hydrate
  const text = await page.innerText("body");
  const missing = needles.filter((n) => !text.includes(n));
  console.log(`\n=== ${route} (${note}) ===`);
  console.log(missing.length === 0 ? "PASS" : `MISSING: ${missing.join(" | ")}`);
  // 附加信息：funds-split 是否出现（Open+feasible 时应显示单价拆分）
  const hasFundsSplit = text.includes("Where every penny goes") || text.includes("每一分钱去哪了");
  console.log(`funds-split 渲染: ${hasFundsSplit}`);
  if (route === "/campaigns/success") {
    const idx = text.indexOf("0.0238");
    console.log("0.0238 上下文:", idx >= 0 ? JSON.stringify(text.slice(Math.max(0, idx - 80), idx + 80)) : "(未找到)");
  }
}
await browser.close();
