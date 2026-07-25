"use client";

import { useLanguage } from "./context";
import { dictionaries, type Copy, type Language } from "./dictionaries";

export function useCopy(): Copy {
  const { language } = useLanguage();
  return dictionaries[language];
}

export function useCopyWithLang(): { copy: Copy; language: Language } {
  const { language } = useLanguage();
  return { copy: dictionaries[language], language };
}
