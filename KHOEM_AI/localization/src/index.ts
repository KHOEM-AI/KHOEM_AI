import { LANGUAGES } from "./registry/languages.js";
import { LOCALES } from "./registry/locales.js";
import { availableLocales } from "./core/loader.js";
import { resolveLocale as resolve } from "./core/resolver.js";
import { KhoemError } from "./core/errors.js";
import type { LanguageRecord, LocaleRecord } from "./types/index.js";

export { getTranslation, getTranslationDetailed, createTranslator, hasTranslation } from "./core/translator.js";
export { getTranslationCoverage, allCoverage } from "./core/coverage.js";
export { clearCache, clearLocaleCache } from "./core/loader.js";
export { getLocaleDirection } from "./core/direction.js";
export { canonicalizeLocale, resolveLocaleDetailed } from "./core/resolver.js";
export { buildFallbackChain } from "./core/fallback.js";
export { KhoemError } from "./core/errors.js";
export { buildLanguageHub, getHubEntry } from "./hub/languageHub.js";
export type { LanguageHubEntry } from "./hub/languageHub.js";
export type * from "./types/index.js";

/** Resolve against locales that actually have translation data. */
export const resolveLocale = (requested: string): string | null => resolve(requested, availableLocales());

export const listLanguages = (): readonly LanguageRecord[] => LANGUAGES;
export const listLocales = (): readonly LocaleRecord[] => LOCALES;

export function getLanguage(id: string): LanguageRecord {
  const l = LANGUAGES.find((x) => x.languageId === id);
  if (!l) throw new KhoemError("LANGUAGE_NOT_FOUND", `Language not found: ${id}`);
  return l;
}
export function getLocale(id: string): LocaleRecord {
  const l = LOCALES.find((x) => x.locale === id);
  if (!l) throw new KhoemError("LOCALE_NOT_FOUND", `Locale not found: ${id}`);
  return l;
}
