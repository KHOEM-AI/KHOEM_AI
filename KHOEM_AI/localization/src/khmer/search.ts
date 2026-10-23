import { KHMER_ENTRIES } from "./data.js";

const norm = (s: string): string =>
  s
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[?។!！？,，.៖;；:]+$/u, "")
    .replace(/\s+/gu, " ");

const MAP = new Map<string, string>();
const ALIASES: string[] = [];

for (const [keys, answer] of KHMER_ENTRIES) {
  for (const alias of keys.split("|")) {
    const key = norm(alias);
    if (!key) continue;

    if (!MAP.has(key)) {
      MAP.set(key, answer);
      ALIASES.push(key);
    }
  }
}

const chars = (s: string): string[] => Array.from(s);

function editDistance(a: string, b: string, limit: number): number {
  const x = chars(a);
  const y = chars(b);

  if (Math.abs(x.length - y.length) > limit) return limit + 1;
  if (x.join("") === y.join("")) return 0;

  let prevPrev: number[] | undefined;
  let prev = Array.from({ length: y.length + 1 }, (_, i) => i);

  for (let i = 1; i <= x.length; i++) {
    const curr = new Array<number>(y.length + 1);
    curr[0] = i;

    let rowMin = curr[0]!;

    for (let j = 1; j <= y.length; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;

      curr[j] = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + cost,
      );

      if (
        i > 1 &&
        j > 1 &&
        x[i - 1] === y[j - 2] &&
        x[i - 2] === y[j - 1]
      ) {
        curr[j] = Math.min(curr[j]!, (prevPrev?.[j - 2] ?? limit + 1) + 1);
      }

      rowMin = Math.min(rowMin, curr[j]!);
    }

    if (rowMin > limit) return limit + 1;

    prevPrev = prev;
    prev = curr;
  }

  return prev[y.length]!;
}

export function searchKhmerExact(q: string): string | null {
  const key = norm(q);
  return key ? MAP.get(key) ?? null : null;
}

export function searchKhmer(q: string): string | null {
  const key = norm(q);
  if (!key) return null;

  const exact = MAP.get(key);
  if (exact !== undefined) return exact;

  const queryLength = chars(key).length;

  // Avoid guessing from very short queries.
  if (queryLength < 5 || queryLength > 100) return null;

  const maxDistance = queryLength >= 12 ? 2 : 1;
  let bestDistance = maxDistance + 1;
  let bestAnswer: string | null = null;
  let tied = false;

  for (const alias of ALIASES) {
    const aliasLength = chars(alias).length;

    if (Math.abs(aliasLength - queryLength) > maxDistance) continue;

    const distance = editDistance(key, alias, maxDistance);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestAnswer = MAP.get(alias) ?? null;
      tied = false;
    } else if (distance === bestDistance && distance <= maxDistance) {
      const answer = MAP.get(alias) ?? null;
      if (answer !== bestAnswer) tied = true;
    }
  }

  if (bestDistance > maxDistance || tied) return null;
  return bestAnswer;
}
