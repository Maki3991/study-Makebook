"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en } from "./en";
import { zh } from "./zh";

/**
 * Site-wide language context (EN default, 中文 optional).
 *
 * - Default language is "en"; the persisted choice is restored from
 *   localStorage("makebook-lang") during mount, so first paint always
 *   matches the server's English HTML (no hydration mismatch).
 * - t(key) looks up the active dictionary, falls back to English when the
 *   active language lacks the key, and finally to the key itself.
 * - t(key, vars) interpolates `{name}` tokens (display strings only —
 *   never amounts in wei; callers pass pre-formatted values like formatInj).
 * - Brand / protocol labels (MAKEBOOK, FRAME-01, MOQ, test INJ, the six
 *   source tags, Fixture, hashes) are not dictionary entries: components
 *   render them untranslated in both languages.
 */

export type Language = "en" | "zh";

export type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

const STORAGE_KEY = "makebook-lang";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (token, name: string) =>
    name in vars ? String(vars[name]) : token,
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  // Restore the persisted choice after mount; keep <html lang> in sync.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "zh" || stored === "en") setLangState(stored);
    } catch {
      // Storage unavailable (private mode) — stay on the English default.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the in-memory choice still applies.
    }
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => {
      const active = lang === "zh" ? zh : en;
      const value = active[key] ?? en[key] ?? key;
      return interpolate(value, vars);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLang must be used inside <LanguageProvider>");
  }
  return context;
}

/**
 * Display-layer translation of the on-chain campaign state enum.
 * reads.campaignStateName stays the chain-layer English source of truth;
 * this maps the same uint8 onto dictionary labels (unknown values fall
 * back to the English enum name).
 */
export function useCampaignStateLabel(): (state: number) => string {
  const { t } = useLang();
  return useCallback(
    (state: number): string => {
      switch (state) {
        case 0:
          return t("state.draft");
        case 1:
          return t("state.open");
        case 2:
          return t("state.succeeded");
        case 3:
          return t("state.failed");
        case 4:
          return t("state.paidout");
        default:
          return "Draft";
      }
    },
    [t],
  );
}
