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
  const [screenSource, styles, layout, packageJson] = await Promise.all([
    readFile(
      new URL("../app/components/story-screens.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(packageJson, /"name": "makebook-frontend"/);
  assert.match(layout, /title: "MAKEBOOK · 造物簿"/);
  assert.match(screenSource, /inputMode="decimal"/);
  assert.match(screenSource, /正在等待 Injective 确认。请不要重复点击。/);
  assert.match(screenSource, /你的钱包地址、最高愿付价和交易会公开出现/);
  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1279px\)/);
  assert.match(styles, /@media \(min-width: 1280px\)/);
  assert.match(styles, /\.wallet-pill\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.order-submit[\s\S]*position:\s*fixed/);
});
