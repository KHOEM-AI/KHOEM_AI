import { KhoemError } from "./errors.js";
import { availableLocales, isValidKey, loadLocale } from "./loader.js";
import { canonicalizeLocale, resolveLocaleDetailed } from "./resolver.js";
import { SOURCE_LOCALE } from "../locales/index.js";
import type { FlatTranslations, TranslationParams, TranslationResult, TranslationValue } from "../types/index.js";

export interface TranslatorOptions {
  fallbackLocale?: string;
  strict?: boolean; // throw TRANSLATION_NOT_FOUND instead of returning the key
  onMissing?: (info: { key: string; locale: string }) => void;
}

const PLACEHOLDER = /\{\{\s*([A-Za-z_]\w*)\s*\}\}/g;
export const extractPlaceholders = (s: string): string[] =>
  [...new Set([...s.matchAll(PLACEHOLDER)].map((m) => m[1] as string))].sort();

export function interpolate(text: string, params?: TranslationParams): string {
  if (!params) return text;
  return text.replace(PLACEHOLDER, (whole, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : whole);
}

function pick(value: TranslationValue, locale: string, params?: TranslationParams): string | undefined {
  if (typeof value === "string") return value;
  const count = params?.["count"];
  if (typeof count !== "number") throw new KhoemError("INVALID_PARAMETERS", "Plural key requires numeric 'count'");
  const cat = new Intl.PluralRules(locale).select(count);
  return value[cat] ?? value.other;
}

/** Look up one key, applying locale resolution and per-key fallback. */
export async function getTranslationDetailed(
  locale: string, key: string, params?: TranslationParams, opts: TranslatorOptions = {},
): Promise<TranslationResult> {
  if (!isValidKey(key)) throw new KhoemError("INVALID_TRANSLATION_KEY", "Invalid translation key");
  const fallbackLocale = opts.fallbackLocale ?? SOURCE_LOCALE;
  const avail = availableLocales();
  const primary = resolveLocaleDetailed(locale, avail);
  if (!primary.canonical) throw new KhoemError("INVALID_LOCALE", "Invalid locale identifier");

  const tries: string[] = [];
  if (primary.resolved) tries.push(primary.resolved);
  const fb = resolveLocaleDetailed(fallbackLocale, avail).resolved;
  if (fb && !tries.includes(fb)) tries.push(fb);

  for (const l of tries) {
    const data: FlatTranslations = await loadLocale(l);
    const v = Object.hasOwn(data, key) ? data[key] : undefined;
    if (v !== undefined) {
      const raw = pick(v, l, params);
      if (raw !== undefined && raw !== "") {
        return {
          text: interpolate(raw, params), key, requestedLocale: locale,
          resolvedLocale: primary.resolved, usedLocale: l,
          fallbackUsed: l !== primary.resolved, missing: false,
        };
      }
    }
  }
  opts.onMissing?.({ key, locale: primary.canonical });
  if (opts.strict) throw new KhoemError("TRANSLATION_NOT_FOUND", `Translation key not found: ${key}`);
  return {
    text: key, key, requestedLocale: locale, resolvedLocale: primary.resolved,
    usedLocale: null, fallbackUsed: false, missing: true,
  };
}

export async function getTranslation(
  locale: string, key: string, params?: TranslationParams, opts?: TranslatorOptions,
): Promise<string> {
  return (await getTranslationDetailed(locale, key, params, opts)).text;
}

export async function hasTranslation(locale: string, key: string): Promise<boolean> {
  if (!isValidKey(key)) return false;
  const r = resolveLocaleDetailed(locale, availableLocales()).resolved;
  if (!r) return false;
  const data = await loadLocale(r);
  return Object.hasOwn(data, key);
}

export interface Translator {
  readonly locale: string;
  readonly resolvedLocale: string | null;
  t(key: string, params?: TranslationParams): string;
}

/** Preloads the needed locales once, then offers a synchronous t(). */
export async function createTranslator(locale: string, opts: TranslatorOptions = {}): Promise<Translator> {
  const canon = canonicalizeLocale(locale);
  if (!canon) throw new KhoemError("INVALID_LOCALE", "Invalid locale identifier");
  const avail = availableLocales();
  const resolved = resolveLocaleDetailed(canon, avail).resolved;
  const fbLocale = resolveLocaleDetailed(opts.fallbackLocale ?? SOURCE_LOCALE, avail).resolved;
  const chain = [resolved, fbLocale].filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
  const data = new Map<string, FlatTranslations>();
  for (const l of chain) data.set(l, await loadLocale(l));
  return {
    locale: canon,
    resolvedLocale: resolved,
    t(key, params) {
      if (!isValidKey(key)) throw new KhoemError("INVALID_TRANSLATION_KEY", "Invalid translation key");
      for (const l of chain) {
        const d = data.get(l);
        const v = d && Object.hasOwn(d, key) ? d[key] : undefined;
        if (v !== undefined) {
          const raw = pick(v, l, params);
          if (raw) return interpolate(raw, params);
        }
      }
      opts.onMissing?.({ key, locale: canon });
      if (opts.strict) throw new KhoemError("TRANSLATION_NOT_FOUND", `Translation key not found: ${key}`);
      return key;
    },
  };
}
