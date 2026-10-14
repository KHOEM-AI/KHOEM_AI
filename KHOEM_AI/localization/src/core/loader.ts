import { LOCALE_LOADERS } from "../locales/index.js";
import { LOCALES } from "../registry/locales.js";
import { KhoemError } from "./errors.js";
import { LruCache, cacheStats } from "./cache.js";
import { canonicalizeLocale } from "./resolver.js";
import type { FlatTranslations, PluralForms, TranslationTree } from "../types/index.js";

const PLURAL_KEYS = new Set(["zero", "one", "two", "few", "many", "other"]);
const KEY_RE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)*$/;

export const isValidKey = (k: unknown): k is string => typeof k === "string" && k.length <= 200 && KEY_RE.test(k);

function isPluralObject(v: unknown): v is PluralForms {
  if (typeof v !== "object" || v === null) return false;
  const keys = Object.keys(v);
  return keys.length > 0 && keys.every((k) => PLURAL_KEYS.has(k) && typeof (v as Record<string, unknown>)[k] === "string");
}

export function flatten(tree: TranslationTree, prefix = "", out: FlatTranslations = {}): FlatTranslations {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else if (isPluralObject(v)) out[key] = v;
    else flatten(v as TranslationTree, key, out);
  }
  return out;
}

const cache = new LruCache<FlatTranslations>(32);

/** Locales that have translation data available. */
export const availableLocales = (): string[] => Object.keys(LOCALE_LOADERS);

export async function loadLocale(locale: string): Promise<FlatTranslations> {
  const canon = canonicalizeLocale(locale);
  if (!canon) throw new KhoemError("INVALID_LOCALE", "Invalid locale identifier");
  if (!LOCALES.some((l) => l.locale === canon)) throw new KhoemError("UNSUPPORTED_LOCALE", `Locale not registered: ${canon}`);
  const hit = cache.get(canon);
  if (hit) { cacheStats.hits++; return hit; }
  cacheStats.misses++;
  const loader = Object.hasOwn(LOCALE_LOADERS, canon) ? LOCALE_LOADERS[canon] : undefined;
  if (!loader) throw new KhoemError("LOCALE_NOT_FOUND", `No translation data for locale: ${canon}`);
  const mod = await loader();
  const flat = flatten(mod.default);
  cache.set(canon, flat);
  return flat;
}

export function clearCache(): void { cache.clear(); cacheStats.hits = 0; cacheStats.misses = 0; }
export function clearLocaleCache(locale: string): void {
  const canon = canonicalizeLocale(locale);
  if (canon) cache.delete(canon);
}
