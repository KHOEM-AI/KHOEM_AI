import { loadLocale } from "../core/loader.js";
import { KhoemError } from "../core/errors.js";
import { COLOR_TERMS } from "./colors.js";

export type DictLang = "en" | "km" | "zh";
const LANGS: readonly string[] = ["en", "km", "zh"];

interface Entry {
  key: string;
  source: "ui" | "color";
  texts: Record<DictLang, string>;
}

export interface DictMatch {
  key: string;
  source: "ui" | "color";
  original: string;
  text: string;
  missing: boolean;
}

export interface DictResult {
  query: string;
  from: DictLang;
  to: DictLang;
  found: boolean;
  matches: DictMatch[];
  suggestions: DictMatch[];
}

const isLang = (s: string): s is DictLang => LANGS.includes(s);

const norm = (s: string): string =>
  s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.។?!？！。]+$/u, "");

async function build(): Promise<Entry[]> {
  const [en, km, zh] = await Promise.all([loadLocale("en"), loadLocale("km"), loadLocale("zh")]);
  const entries: Entry[] = [];
  for (const [key, v] of Object.entries(en)) {
    if (typeof v !== "string") continue;
    const k = km[key];
    const z = zh[key];
    entries.push({
      key,
      source: "ui",
      texts: { en: v, km: typeof k === "string" ? k : "", zh: typeof z === "string" ? z : "" },
    });
  }
  for (const c of COLOR_TERMS) {
    entries.push({ key: "color." + c.id, source: "color", texts: { en: c.en, km: c.km, zh: c.zh } });
  }
  return entries;
}

let index: Promise<Entry[]> | null = null;
function getIndex(): Promise<Entry[]> {
  if (index === null) {
    index = build().catch((e: unknown) => {
      index = null;
      throw e;
    });
  }
  return index;
}

export async function lookupDictionary(query: string, from: string, to: string): Promise<DictResult> {
  if (!isLang(from) || !isLang(to)) {
    throw new KhoemError("INVALID_LOCALE", "from and to must be one of: en, km, zh");
  }
  const q = norm(query);
  const all = await getIndex();
  const mk = (e: Entry): DictMatch => ({
    key: e.key,
    source: e.source,
    original: e.texts[from],
    text: e.texts[to],
    missing: e.texts[to] === "",
  });
  const withText = all.filter((e) => e.texts[from] !== "");
  const matches = withText.filter((e) => norm(e.texts[from]) === q).map(mk);
  let suggestions: DictMatch[] = [];
  if (matches.length === 0 && q.length >= 2) {
    suggestions = withText
      .filter((e) => {
        const n = norm(e.texts[from]);
        return n.includes(q) || (n.length >= 2 && q.includes(n));
      })
      .slice(0, 8)
      .map(mk);
  }
  return { query, from, to, found: matches.length > 0, matches: matches.slice(0, 8), suggestions };
}
