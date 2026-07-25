import { chromium } from "playwright";
import { writeFileSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.OUT || "./scripts/verify-i18n-report.txt";

const pages = [
  { name: "home", path: "/" },
  { name: "campaign-success", path: "/campaigns/success" },
  { name: "campaign-failure", path: "/campaigns/failure" },
  { name: "orders", path: "/orders" },
  { name: "console", path: "/console" },
];

const viewports = [
  { label: "mobile", width: 390, height: 844, dpr: 2 },
  { label: "demo", width: 1024, height: 768, dpr: 1 },
  { label: "desktop", width: 1920, height: 1080, dpr: 1 },
];

const languages = [
  { code: "en", label: "EN" },
  { code: "zh", label: "ZH" },
];

const browser = await chromium.launch({ headless: true });

let report = `MAKEBOOK i18n verification — ${new Date().toISOString()}\n`;
report += `Base URL: ${BASE}\n`;
report += "=".repeat(60) + "\n\n";

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const results = [];
    const selectors = ["body", "main", "header", ".page"];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const scrollW = el.scrollWidth;
      const clientW = el.clientWidth;
      results.push({
        selector: sel,
        scrollWidth: scrollW,
        clientWidth: clientW,
        overflowX: scrollW > clientW,
      });
    }
    return results;
  });
}

for (const lang of languages) {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
    });

    for (const p of pages) {
      const page = await context.newPage();
      // Set language before navigation so initial render is localized.
      await page.goto(`${BASE}/`);
      await page.evaluate((code) => {
        window.localStorage.setItem("makebook-language", code);
      }, lang.code);

      const url = `${BASE}${p.path}`;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const title = await page.title().catch(() => "");
      const overflow = await checkOverflow(page);
      const hasOverflow = overflow.some((o) => o.overflowX);

      const screenshotPath = `./visual-snapshots/i18n-${lang.code}-${p.name}-${vp.label}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      report += `--- ${lang.code} ${p.name} ${vp.label} (${url}) ---\n`;
      report += `title: ${title}\n`;
      report += `screenshot: ${screenshotPath}\n`;
      report += `overflow: ${JSON.stringify(overflow)}\n`;
      report += `hasOverflow: ${hasOverflow}\n\n`;

      await page.close();
    }

    await context.close();
  }
}

await browser.close();

writeFileSync(OUT, report, "utf-8");
console.log(`Wrote report to ${OUT}`);
