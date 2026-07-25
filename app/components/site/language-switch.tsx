"use client";

import { useLanguage } from "@/app/lib/i18n/context";
import { useCopy } from "@/app/lib/i18n/use-copy";

const OPTIONS = [
  { code: "en", label: "EN" },
  { code: "zh", label: "中" },
] as const;

// Spec 009 N-11: show both languages side by side with the active one
// highlighted, instead of a single ambiguous toggle button.
export function LanguageSwitch({ onSelected }: { onSelected?: () => void }) {
  const { language, setLanguage } = useLanguage();
  const copy = useCopy();

  return (
    <div
      role="group"
      aria-label={copy.global.a11y.toggleLanguage}
      className="flex items-center"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          aria-pressed={language === option.code}
          onClick={() => {
            setLanguage(option.code);
            onSelected?.();
          }}
          // The "中" label renders on en pages too; without this stack the
          // CJK subset's unicode-range would match it and pull a 65KB font
          // onto every en pageview for one glyph. System CJK first, subset
          // last as the portable fallback (spec 009 §1.5).
          style={
            option.code === "zh"
              ? { fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC Subset", sans-serif' }
              : undefined
          }
          className={`whitespace-nowrap px-2 py-1 text-body font-medium transition-colors ${
            language === option.code
              ? "font-semibold text-accent"
              : "text-ink-3 hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
