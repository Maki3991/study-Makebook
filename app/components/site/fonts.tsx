"use client";

import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
// spec 009 §1.5: CJK now ships as a build-time subset via @font-face in
// globals.css (scripts/build-cjk-subset.mjs → public/fonts/) — the
// @fontsource-variable/noto-sans-sc 101-shard cascade is no longer loaded.

export function Fonts() {
  return null;
}
