import { copy as en } from "@/app/lib/copy";
import { zh } from "./zh";

export type Copy = typeof en;
export type Language = "en" | "zh";

export const dictionaries: Record<Language, Copy> = {
  en,
  zh: zh as unknown as Copy,
};
