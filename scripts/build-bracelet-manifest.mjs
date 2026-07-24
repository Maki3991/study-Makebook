// 一次性脚本：构建 BRACELET-01 manifest → Zod 校验 → canonicalize → 写文件 + 打印 hash
import { writeFileSync } from "node:fs";
import { MarketManifestSchema } from "../lib/schema/manifest.ts";
import { canonicalize, canonicalHash } from "../lib/schema/canonicalize.ts";

const manifest = {
  schemaVersion: "makebook.manifest.v1",
  campaignCode: "BRACELET-01",
  title: "Tech & AI Heritage Bracelet",
  specs: [
    { key: "materials", value: "18k gold-plated with mother-of-pearl inlays", sourceCommentIds: ["b04", "b05", "b12"] },
    { key: "charms", value: "five symbolic charms: knot, diamond spark, sunburst, infinity, compass toggle", sourceCommentIds: ["b01", "b02", "b03", "b08", "b13", "b17"] },
    { key: "style", value: "unisex tech-heritage daily jewelry, low-profile charms safe for keyboard typing", sourceCommentIds: ["b06", "b11", "b14", "b16"] },
    { key: "size", value: "adjustable delicate chain, one size fits most", sourceCommentIds: ["b10", "b16"] },
  ],
  unknowns: ["Final gold plating thickness", "Mother-of-pearl batch color variance", "Water resistance rating"],
  aiGenerated: true,
  humanConfirmedAt: "2026-07-24T18:32:00Z",
};

const parsed = MarketManifestSchema.parse(manifest);
const canonical = canonicalize(parsed);
const hash = canonicalHash(parsed);
writeFileSync(new URL("../public/manifests/heritage-bracelet.json", import.meta.url), canonical + "\n");
console.log("manifest OK ->", "public/manifests/heritage-bracelet.json");
console.log("manifestHash =", hash);
