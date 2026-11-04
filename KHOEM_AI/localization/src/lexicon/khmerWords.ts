import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { KhoemError } from "../core/errors.js";
import { lookupDictionary } from "./dictionary.js";

export type WordTier = "A" | "B" | "C";

export interface KhmerToken {
  text: string;
  known: boolean;
  tier: WordTier | null;
  count: number | null;
  translation: string | null;
}

export interface KhmerAnalysis {
  query: string;
  to: "en" | "zh";
  tokens: KhmerToken[];
  known: number;
  unknown: number;
  translated: number;
}

interface WordInfo {
  tier: WordTier;
  count: number;
}

type SegmenterCtor = new (
  locale: string,
  options: { granularity: "word" },
) => { segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }> };

const WORD_FILE = fileURLToPath(new URL("../../../data/khmer-words.clean.tsv", import.meta.url));
const KHMER = /[\u1780-\u17FF]/;
// A single bare consonant is an alphabet letter, not a word (the Wiktionary list has the letters as titles).
const SINGLE_CONSONANT = /^[\u1780-\u17A2]$/;
const MAX_TOKENS = 80;

let wordMap: Map<string, WordInfo> | null = null;
let segmenter: InstanceType<SegmenterCtor> | null = null;

function loadWords(): Map<string, WordInfo> {
  if (wordMap !== null) return wordMap;
  const map = new Map<string, WordInfo>();
  const text = readFileSync(WORD_FILE, "utf8");
  for (const line of text.split("\n")) {
    if (line === "") continue;
    const [word, count, tier] = line.split("\t");
    if (word === undefined || (tier !== "A" && tier !== "B" && tier !== "C")) continue;
    map.set(word, { tier, count: Number(count) || 0 });
  }
  wordMap = map;
  return map;
}

function getSegmenter(): InstanceType<SegmenterCtor> {
  if (segmenter !== null) return segmenter;
  const ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
  if (ctor === undefined) throw new Error("Intl.Segmenter is not available in this runtime");
  segmenter = new ctor("km", { granularity: "word" });
  return segmenter;
}

/** Cut Khmer text into words, mark which are in the word list, and attach a translation when the dictionary has one. */
export async function analyzeKhmer(query: string, to: string): Promise<KhmerAnalysis> {
  if (to !== "en" && to !== "zh") {
    throw new KhoemError("INVALID_LOCALE", "to must be one of: en, zh");
  }
  const words = loadWords();
  const tokens: KhmerToken[] = [];
  const cache = new Map<string, string | null>();
  for (const s of getSegmenter().segment(query.normalize("NFC"))) {
    if (tokens.length >= MAX_TOKENS) break;
    if (s.isWordLike !== true || !KHMER.test(s.segment)) continue;
    const text = s.segment;
    const letterOnly = SINGLE_CONSONANT.test(text);
    const info = letterOnly ? undefined : words.get(text);
    let translation: string | null | undefined = letterOnly ? null : cache.get(text);
    if (translation === undefined) {
      const r = await lookupDictionary(text, "km", to);
      translation = r.matches.find((m) => !m.missing)?.text ?? null;
      cache.set(text, translation);
    }
    tokens.push({
      text,
      known: info !== undefined,
      tier: info?.tier ?? null,
      count: info?.count ?? null,
      translation,
    });
  }
  const known = tokens.filter((t) => t.known).length;
  const translated = tokens.filter((t) => t.translation !== null).length;
  return { query, to, tokens, known, unknown: tokens.length - known, translated };
}
