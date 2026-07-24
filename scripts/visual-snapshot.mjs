import { chromium } from "playwright";
import { writeFileSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.OUT || "./visual-snapshots.txt";

const pages = [
  { name: "home", path: "/" },
  { name: "campaign-success", path: "/campaigns/success" },
  { name: "campaign-failure", path: "/campaigns/failure" },
];

const browser = await chromium.launch({ headless: true });

const viewports = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

let report = `MAKEBOOK visual snapshots — ${new Date().toISOString()}\n`;
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
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const title = await page.title();
    const text = await page
      .locator("main")
      .innerText({ timeout: 5000 })
      .catch(() => "");

    const screenshotPath = `./visual-snapshots/${p.name}-${vp.label}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    report += `--- ${p.name} ${vp.label} (${url}) ---\n`;
    report += `title: ${title}\n`;
    report += `screenshot: ${screenshotPath}\n`;
    report += `text:\n${text.trim()}\n\n`;

    await page.close();
  }

  await context.close();
}

await browser.close();

writeFileSync(OUT, report, "utf-8");
console.log(`Wrote snapshots to ${OUT}`);
