import { availableLocales, loadLocale } from "./loader.js";
import { SOURCE_LOCALE } from "../locales/index.js";
import { extractPlaceholders } from "./translator.js";
import type { LanguageStatus } from "../types/index.js";
import { LANGUAGES } from "../registry/languages.js";

export interface Coverage {
  language: string; locale: string; totalKeys: number; translated: number;
  missing: string[]; extra: string[]; empty: string[]; placeholderMismatch: string[];
  coverage: number; declaredStatus: LanguageStatus; computedStatus: LanguageStatus;
}

const asText = (v: unknown): string => (typeof v === "string" ? v : JSON.stringify(v));

export async function getTranslationCoverage(locale: string): Promise<Coverage> {
  const src = await loadLocale(SOURCE_LOCALE);
  const tgt = await loadLocale(locale);
  const srcKeys = Object.keys(src);
  const missing = srcKeys.filter((k) => !(k in tgt));
  const extra = Object.keys(tgt).filter((k) => !(k in src));
  const empty = Object.keys(tgt).filter((k) => asText(tgt[k]).trim() === "");
  const mismatch = srcKeys.filter((k) => {
    const a = src[k]; const b = tgt[k];
    if (typeof a === "string" && typeof b === "string")
      return extractPlaceholders(a).join() !== extractPlaceholders(b).join();
    return false;
  });
  const translated = srcKeys.length - missing.length - empty.filter((k) => k in src).length;
  const pct = srcKeys.length ? Math.round((translated / srcKeys.length) * 1000) / 10 : 0;
  const language = new Intl.Locale(locale).language;
  const declared = LANGUAGES.find((l) => l.languageId === language)?.status ?? "planned";
  const clean = missing.length === 0 && extra.length === 0 && empty.length === 0 && mismatch.length === 0;
  const computed: LanguageStatus = translated === 0 ? "planned" : clean ? "complete" : "partial";
  return { language, locale, totalKeys: srcKeys.length, translated, missing, extra, empty,
    placeholderMismatch: mismatch, coverage: pct, declaredStatus: declared, computedStatus: computed };
}

export async function allCoverage(): Promise<Coverage[]> {
  return Promise.all(availableLocales().map(getTranslationCoverage));
}
