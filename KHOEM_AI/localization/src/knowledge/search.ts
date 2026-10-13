import { KNOWLEDGE_DATABASES } from "./data.js";

// Ported from AI/src/ai/knowledge.mjs. Longest matching keyword wins,
// ties go to the earlier database. Edit here, not in AI.

const GENERIC_KEYS: ReadonlySet<string> = new Set([
  "tech", "food", "pc", "tv", "car", "ev", "water", "កសាង", "ទឹក", "ឧបករណ៍",
]);

const CURRENT_CARE: readonly string[] = [
  "hospital services", "hospital near", "medical services",
  "healthcare today", "សេវាពេទ្យ", "សេវាសុខាភិបាល",
  "មន្ទីរពេទ្យនៅ", "រកមន្ទីរពេទ្យ", "ពេទ្យបច្ចុប្បន្ន",
];

function grams(s: string): Map<string, number> {
  const g = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const b = s.slice(i, i + 2);
    g.set(b, (g.get(b) ?? 0) + 1);
  }
  return g;
}

function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  for (const [k, v] of A) inter += Math.min(v, B.get(k) ?? 0);
  return (2 * inter) / (a.length - 1 + b.length - 1);
}

export function normalizeKnowledgeQuery(query: unknown): string {
  return String(query || "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[?!.,;:"'()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aliasQuery(q: string): string {
  const normalized = normalizeKnowledgeQuery(q);
  const aiQuestion =
    /^(explain|describe|define|tell me about|what is|what are)\s+(ai|artificial intelligence)\b/.test(normalized) ||
    /^(ai|artificial intelligence)\s+(ជាអ្វី|មានន័យដូចម្តេច)/.test(normalized) ||
    /^(ពន្យល់|ប្រាប់អំពី)\s*(អំពី)?\s*(ai|បញ្ញាសិប្បនិម្មិត|អេអាយ)\b/.test(normalized);
  return aiQuestion
    ? normalized + " artificial intelligence machine learning បញ្ញាសិប្បនិម្មិត អេអាយ"
    : normalized;
}

function isCurrentHealthcareQuestion(q: string): boolean {
  return CURRENT_CARE.some((key) => q.includes(key));
}

export function fuzzySearchKnowledge(query: string, threshold = 0.72): string | null {
  const q = normalizeKnowledgeQuery(query);
  if (!q || q.length > 24 || q.includes(" ")) return null;
  let best: string | null = null;
  let score = 0;
  for (const db of KNOWLEDGE_DATABASES) {
    for (const item of db) {
      for (const keyword of item.keywords) {
        const k = normalizeKnowledgeQuery(keyword);
        if (k.length < 3 || k.length > 24 || k.includes(" ")) continue;
        const candidate = dice(q, k);
        if (candidate > score) { score = candidate; best = item.info; }
      }
    }
  }
  return score >= threshold ? best : null;
}

export function searchKnowledge(query: unknown): string | null {
  const q = normalizeKnowledgeQuery(query);
  if (!q) return null;
  if (isCurrentHealthcareQuestion(q)) return null;

  const routed = aliasQuery(q);
  const matches: { info: string; key: string; dbIndex: number }[] = [];

  KNOWLEDGE_DATABASES.forEach((db, dbIndex) => {
    for (const item of db) {
      for (const keyword of item.keywords) {
        const key = normalizeKnowledgeQuery(keyword);
        if (key.length < 2 || !routed.includes(key)) continue;
        if (GENERIC_KEYS.has(key)) continue;
        matches.push({ info: item.info, key, dbIndex });
      }
    }
  });

  matches.sort((a, b) => b.key.length - a.key.length || a.dbIndex - b.dbIndex);
  const top = matches[0];
  if (top) return top.info;

  if (routed.length <= 24 && !/[?!.]/.test(String(query || ""))) {
    return fuzzySearchKnowledge(routed, 0.72);
  }
  return null;
}

export function knowledgeStats(): { databases: number; totalEntries: number } {
  return {
    databases: KNOWLEDGE_DATABASES.length,
    totalEntries: KNOWLEDGE_DATABASES.reduce((n, db) => n + db.length, 0),
  };
}

/**
 * Strict lookup for routing ahead of the generic language replies.
 * Real keyword match only (no fuzzy), keyword must cover most of the query,
 * and AI-alias queries are skipped. Returns null otherwise.
 */
export function searchKnowledgeExact(query: unknown, minCoverage = 0.6): string | null {
  const q = normalizeKnowledgeQuery(query);
  if (!q || isCurrentHealthcareQuestion(q)) return null;
  const routed = aliasQuery(q);
  if (routed !== q) return null;

  let bestInfo: string | null = null;
  let bestLen = 0;
  for (const db of KNOWLEDGE_DATABASES) {
    for (const item of db) {
      for (const keyword of item.keywords) {
        const key = normalizeKnowledgeQuery(keyword);
        if (key.length < 2 || GENERIC_KEYS.has(key) || !q.includes(key)) continue;
        if (key.length > bestLen) { bestLen = key.length; bestInfo = item.info; }
      }
    }
  }
  return bestInfo !== null && bestLen / q.length >= minCoverage ? bestInfo : null;
}
