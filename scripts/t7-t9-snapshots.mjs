import { chromium } from "playwright";
import { writeFileSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.OUT || "./t7-t9-snapshots.txt";

const pages = [
  { name: "home", path: "/" },
  { name: "campaign-success", path: "/campaigns/success" },
  { name: "campaign-failure", path: "/campaigns/failure" },
  { name: "orders", path: "/orders" },
  { name: "console", path: "/console" },
];

const browser = await chromium.launch({ headless: true });

const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1280, height: 900 },
];

let report = `MAKEBOOK T7-T9 visual snapshots — ${new Date().toISOString()}\n`;
report += `Base URL: ${BASE}\n`;
report += "=".repeat(60) + "\n\n";

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.label === "mobile" ? 2 : 1,
  });

  for (const p of pages) {
    const page = await context.newPage();
    const url = `${BASE}${p.path}`;
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);

      const title = await page.title();
      const text = await page
        .locator("main")
        .innerText({ timeout: 5000 })
        .catch(() => "");

      const screenshotPath = `./visual-snapshots/t7-t9-${p.name}-${vp.label}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      report += `--- ${p.name} ${vp.label} (${url}) ---\n`;
      report += `title: ${title}\n`;
      report += `screenshot: ${screenshotPath}\n`;
      report += `text preview:\n${text.trim().slice(0, 600)}\n\n`;
    } catch (err) {
      report += `--- ${p.name} ${vp.label} (${url}) ---\n`;
      report += `ERROR: ${err.message}\n\n`;
    }

    await page.close();
  }

  await context.close();
}

await browser.close();

writeFileSync(OUT, report, "utf-8");
console.log(`Wrote snapshots to ${OUT}`);
