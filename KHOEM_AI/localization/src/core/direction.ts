import { LANGUAGES } from "../registry/languages.js";
import { canonicalizeLocale } from "./resolver.js";
import type { Direction } from "../types/index.js";

export function getLocaleDirection(locale: string): Direction {
  const canon = canonicalizeLocale(locale);
  if (!canon) return "ltr";
  const lang = new Intl.Locale(canon).language;
  return LANGUAGES.find((l) => l.languageId === lang)?.direction ?? "ltr";
}
