// Spec 009 §1.1: single source of truth for color values in non-CSS contexts
// (viewport themeColor, RainbowKit theme, ...). Mirrors @theme in globals.css —
// components must not hardcode hex values anywhere else.
export const tokens = {
  paper0: "#F5F3EF",
  paper1: "#FCFBF9",
  paper2: "#EBE7E1",
  rule1: "#DDD8D0",
  rule2: "#C4BEB4",
  ink1: "#14140F",
  ink2: "#45443C",
  ink3: "#85837A",
  accent: "#B23A18",
  accentW: "#F5E6DF",
  ok: "#2E6B4F",
  warn: "#9A6414",
  err: "#8F2F22",
} as const;
