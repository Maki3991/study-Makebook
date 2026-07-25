import { chromium } from "playwright";
const BASE = "http://127.0.0.1:3210";
const browser = await chromium.launch({ headless: true, args: ["--no-proxy-server"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
let failures = 0;
const report = (n, m) => { if (m.length === 0) console.log(`PASS  ${n}`); else { failures++; console.log(`FAIL  ${n} — MISSING: ${m.join(" | ")}`); } };

await page.goto(BASE + "/campaigns/bracelet", { waitUntil: "domcontentloaded" });
try { await page.waitForFunction(() => document.body.innerText.includes("HERITAGE"), { timeout: 30000, polling: 500 }); } catch {}
await page.waitForTimeout(800);
let text = (await page.innerText("body")).replace(/\s+/g, " ");
report("bracelet byline HERITAGE STUDIO", ["Sold by HERITAGE STUDIO", "DEMO BRAND", "0x42a0…3B0a"].filter((n) => !text.includes(n)));

await page.goto(BASE + "/console", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
text = (await page.innerText("body")).replace(/\s+/g, " ");
// 未连钱包时 role tag 不渲染（既有行为，不在本阶段范围）；页面与其余区块应正常
report("console renders (guest)", ["Console", "Batch monitor", "Demand compiler"].filter((n) => !text.includes(n)));
await page.screenshot({ path: "visual-snapshots/spec009-console-guest-desktop.png", fullPage: true });

await browser.close();
console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
