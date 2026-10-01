import type { LocaleRecord } from "../types/index.js";
import { LANGUAGES } from "./languages.js";
import { buildFallbackChain } from "../core/fallback.js";

interface ExtraLocale { locale: string; parentLocale: string; }

// Regional/script variants. Every entry must reference a registered language and region.
const EXTRA: readonly ExtraLocale[] = [
  { locale: "en-US", parentLocale: "en" },
  { locale: "en-GB", parentLocale: "en" },
  { locale: "en-AU", parentLocale: "en" },
  { locale: "en-CA", parentLocale: "en" },
  { locale: "km-KH", parentLocale: "km" },
  { locale: "zh-Hans", parentLocale: "zh" },
  { locale: "zh-Hant", parentLocale: "zh" },
  { locale: "zh-CN", parentLocale: "zh-Hans" },
  { locale: "zh-TW", parentLocale: "zh-Hant" },
  { locale: "zh-HK", parentLocale: "zh-Hant" },
  { locale: "ar-SA", parentLocale: "ar" },
  { locale: "ar-EG", parentLocale: "ar" },
  { locale: "ja-JP", parentLocale: "ja" },
  { locale: "ko-KR", parentLocale: "ko" },
  { locale: "th-TH", parentLocale: "th" },
  { locale: "vi-VN", parentLocale: "vi" },
  { locale: "he-IL", parentLocale: "he" },
  { locale: "fr-FR", parentLocale: "fr" },
  { locale: "fr-CA", parentLocale: "fr" },
  { locale: "de-DE", parentLocale: "de" },
  { locale: "es-ES", parentLocale: "es" },
  { locale: "pt-BR", parentLocale: "pt" },
  { locale: "pt-PT", parentLocale: "pt" },
  { locale: "hi-IN", parentLocale: "hi" },
];

function makeRecord(tag: string, parentLocale?: string): LocaleRecord {
  const loc = new Intl.Locale(tag); // explicit subtags only (no maximize)
  const lang = LANGUAGES.find((l) => l.languageId === loc.language);
  return {
    locale: tag,
    language: loc.language,
    ...(loc.script ? { script: loc.script } : {}),
    ...(loc.region ? { region: loc.region } : {}),
    direction: lang?.direction ?? "ltr",
    ...(parentLocale ? { parentLocale } : {}),
    status: lang?.status ?? "planned",
    fallbackChain: buildFallbackChain(tag),
  };
}

export const LOCALES: readonly LocaleRecord[] = [
  ...LANGUAGES.map((l) => makeRecord(l.bcp47)),
  ...EXTRA.map((e) => makeRecord(e.locale, e.parentLocale)),
];
