import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete MAKEBOOK narrative", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>MAKEBOOK · 造物簿<\/title>/);
  assert.match(html, /FRAME-01/);
  assert.match(html, /AI Demand Studio/i);
  assert.match(html, /Campaign Market/i);
  assert.match(html, /Conditional Order/i);
  assert.match(html, /Settlement &amp; Receipt/i);
  assert.match(html, /Human Confirmed/i);
  assert.match(html, /Testnet/i);
});

test("keeps the responsive and transaction requirements in source", async () => {
  const [appSource, screenSource, baseStyles, artStyles, layout, packageJson] =
    await Promise.all([
      readFile(
        new URL("../app/components/makebook-app.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/components/story-screens.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
      readFile(new URL("../app/art-direction.css", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);
  const styles = `${baseStyles}\n${artStyles}`;

  assert.match(packageJson, /"name": "makebook-frontend"/);
  assert.match(packageJson, /"@number-flow\/react"/);
  assert.doesNotMatch(packageJson, /"motion"/);
  assert.match(layout, /title: "MAKEBOOK · 造物簿"/);
  assert.match(appSource, /studioConfirmed/);
  assert.match(appSource, /index > 0 && !studioConfirmed/);
  assert.match(screenSource, /inputMode="decimal"/);
  assert.match(screenSource, /正在等待 Injective 确认。请不要重复点击。/);
  assert.match(screenSource, /你的钱包地址、最高愿付价和交易会公开出现/);
  assert.match(
    screenSource,
    /你将预锁 0\.024 test INJ[\s\S]*提交后不可撤销。/,
  );
  assert.match(
    screenSource,
    /生产批次成立：Factory Loom 的 5 件档位可行，统一价为 0\.019 test INJ。/,
  );
  assert.match(
    screenSource,
    /以下生产进度为链下演示状态，不代表合约验证了真实制造或物流。/,
  );
  assert.match(screenSource, /AI Generated/);
  assert.match(screenSource, /Human Confirmed/);
  assert.match(screenSource, /Demo Factory/);
  assert.match(screenSource, /Off-chain Demo/);
  assert.match(screenSource, /Onchain/);
  assert.match(screenSource, /Testnet/);
  assert.match(styles, /@media \(min-width: 768px\)/);
  assert.match(styles, /@media \(min-width: 1024px\)/);
  assert.match(styles, /@media \(min-width: 1280px\)/);
  assert.match(styles, /\.network-pill,[\s\S]*?\.wallet-pill\s*\{[^}]*min-height:\s*48px/s);
  assert.match(styles, /\.order-submit[\s\S]*position:\s*fixed/);
  assert.match(styles, /--n-12:\s*#dfe3e6/);
  assert.match(styles, /--c-azure:\s*#1b4f6b/);
  assert.match(styles, /\.settlement-ledger[\s\S]*background:\s*var\(--bg\)/);
  assert.doesNotMatch(
    styles,
    /(?:linear|radial|conic|repeating-linear)-gradient|backdrop-filter|box-shadow|text-shadow/,
  );
});
