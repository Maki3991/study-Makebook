"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Language } from "./dictionaries";

const STORAGE_KEY = "makebook-language";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "zh" || stored === "en") return stored;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith("zh") ? "zh" : "en";
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Initialize from localStorage / browser after mount to avoid SSR/hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguageState(getInitialLanguage());
  }, []);

  const persistLanguage = useCallback((lang: Language) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      document.body.setAttribute("data-language", lang);
    }
  }, []);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      persistLanguage(lang);
    },
    [persistLanguage],
  );

  const toggleLanguage = useCallback(() => {
    const next = language === "en" ? "zh" : "en";
    setLanguageState(next);
    persistLanguage(next);
  }, [language, persistLanguage]);

  useEffect(() => {
    persistLanguage(language);
  }, [language, persistLanguage]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
