// spec 009 §1.5 CJK subset 验证（本地生产构建）:
// 1. zh 首页 + zh campaigns/success：中文标题粗重、正文不豆腐（截图）
// 2. 字体请求里只有 subset 两个 woff2，无 fontsource noto 分片
// 3. en 首页不加载任何 CJK 字体（unicode-range 不命中）
// 4. 子集外汉字「龘」落系统兜底（PingFang）而非豆腐
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3211";
const browser = await chromium.launch({ headless: true, args: ["--no-proxy-server"] });
let failures = 0;
const report = (name, missing) => {
  if (missing.length === 0) console.log(`PASS  ${name}`);
  else { failures++; console.log(`FAIL  ${name} — ${missing.join(" | ")}`); }
};

const fontRequests = [];
async function newPage(lang) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: lang === "zh" ? "zh-CN" : "en-US" });
  await ctx.addInitScript((l) => window.localStorage.setItem("makebook-language", l), lang);
  const page = await ctx.newPage();
  page.on("request", (req) => {
    const url = req.url();
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(url)) fontRequests.push({ lang, url });
  });
  return page;
}

// --- zh 首页 -------------------------------------------------------------
{
  const page = await newPage("zh");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const text = (await page.innerText("body")).replace(/\s+/g, " ");
  report("zh home renders", ["说出你愿意付的最高价", "三步上手"].filter((n) => !text.includes(n)));
  // document.fonts 里应出现 subset 家族
  const fonts = await page.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`));
  console.log("  zh document.fonts:", fonts.join(" ; "));
  await page.screenshot({ path: "visual-snapshots/spec015-zh-home-subset.png", fullPage: true });
  // 标题局部放大截图（h1 粗重目检）
  const h1 = page.locator("h1").first();
  if (await h1.count()) {
    await h1.screenshot({ path: "visual-snapshots/spec015-zh-home-h1-zoom.png" });
    const h1Info = await h1.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, text: el.textContent.slice(0, 30) };
    });
    console.log("  zh h1:", JSON.stringify(h1Info));
  }
  await page.context().close();
}

// --- zh campaigns/success -------------------------------------------------
{
  const page = await newPage("zh");
  await page.goto(BASE + "/campaigns/success", { waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(() => document.body.innerText.includes("清算价"), { timeout: 60000, polling: 500 });
  } catch {}
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "visual-snapshots/spec015-zh-success-subset.png", fullPage: true });
  const h = page.locator("h1, h2").first();
  if (await h.count()) await h.screenshot({ path: "visual-snapshots/spec015-zh-success-heading-zoom.png" });
  await page.context().close();
}

// --- en 首页：不应加载 CJK 字体 -------------------------------------------
{
  const page = await newPage("en");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.context().close();
}

// --- 龘 兜底测试 -----------------------------------------------------------
{
  const page = await newPage("zh");
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  const info = await page.evaluate(() => {
    const el = document.createElement("div");
    el.id = "tofu-test";
    el.style.cssText = "font-size:48px;font-weight:800;position:fixed;top:0;left:0;z-index:9999;background:#fff;";
    el.textContent = "龘龖测验"; // 龘/龖 不在子集内（应落 PingFang），测验 在子集内
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    return { fontFamily: cs.fontFamily };
  });
  console.log("  tofu-test stack:", info.fontFamily);
  await page.waitForTimeout(600);
  await page.locator("#tofu-test").screenshot({ path: "visual-snapshots/spec015-tofu-fallback.png" });
  await page.context().close();
}

// --- 字体请求审计 -----------------------------------------------------------
const subset = fontRequests.filter((r) => r.url.includes("noto-sans-sc-subset"));
const shard = fontRequests.filter((r) => /fontsource|noto-sans-sc\/files|noto-sans-sc-variable/i.test(r.url) && !r.url.includes("subset"));
const enCjk = fontRequests.filter((r) => r.lang === "en" && r.url.includes("noto-sans-sc-subset"));
console.log("  all font requests:", fontRequests.map((r) => `[${r.lang}] ${r.url.replace(BASE, "")}`).join("\n    "));
report("subset woff2 loaded on zh pages", subset.length >= 2 ? [] : [`only ${subset.length} subset requests`]);
report("no fontsource noto shards", shard.length === 0 ? [] : shard.map((r) => r.url));
report("en page loads no CJK subset", enCjk.length === 0 ? [] : enCjk.map((r) => r.url));

await browser.close();
console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
