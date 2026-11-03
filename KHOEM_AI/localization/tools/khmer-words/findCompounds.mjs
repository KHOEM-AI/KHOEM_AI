import { readFileSync, writeFileSync } from 'node:fs';

// Report-only: flags tier-C words that split exactly into 2-3 already-known
// tier A/B words (likely a segmenter merge, e.g. "និយាយ"+"ល្អ"). Writes
// data/khmer-words.compound-candidates.tsv for manual review; changes
// nothing in khmer-words.clean.tsv. Run after tier.mjs.
const HOME = process.env.HOME;
const L = `${HOME}/KHOEM_AI/KHOEM_AI/localization`;
const MIN_PART = 2; // minimum Khmer characters per piece, avoids 1-char false splits

const SYL_C = '[\\u1780-\\u17A2]';
const SYL_IV = '[\\u17A3-\\u17B3]';
const SYL_SIGN = '[\\u17C6-\\u17C8\\u17CB-\\u17D1\\u17D3\\u17DD]';
const SYL = `(?:${SYL_C}(?:\\u17D2${SYL_C})*[\\u17C9\\u17CA]?[\\u17B6-\\u17C5]?${SYL_SIGN}*|${SYL_IV}${SYL_SIGN}*)`;
const SYLG = new RegExp(SYL, 'g');
function syllableCount(w) {
  SYLG.lastIndex = 0;
  let n = 0, m;
  while ((m = SYLG.exec(w))) { if (m[0] === '') { SYLG.lastIndex++; continue; } n++; }
  return n;
}

const rows = readFileSync(`${L}/data/khmer-words.clean.tsv`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { const [w, c, tier] = l.split('\t'); return [w, Number(c) || 0, tier]; });

const knownA = new Set();
const knownAB = new Set();
for (const [w, , tier] of rows) {
  if (tier === 'A') knownA.add(w);
  if (tier === 'A' || tier === 'B') knownAB.add(w);
}
function acceptablePart(piece) {
  if (!knownAB.has(piece)) return false;
  if (syllableCount(piece) >= 2) return true;
  return knownA.has(piece);
}

function split2or3(w) {
  const n = w.length;
  for (let i = MIN_PART; i <= n - MIN_PART; i++) {
    const a = w.slice(0, i);
    if (!acceptablePart(a)) continue;
    const b = w.slice(i);
    if (acceptablePart(b)) return [a, b];
    for (let j = i + MIN_PART; j <= n - MIN_PART; j++) {
      const b2 = w.slice(i, j), c2 = w.slice(j);
      if (acceptablePart(b2) && acceptablePart(c2)) return [a, b2, c2];
    }
  }
  return null;
}

const found = [];
for (const [w, c, tier] of rows) {
  if (tier !== 'C') continue;
  const parts = split2or3(w);
  if (parts) found.push([w, c, parts.join('+')]);
}
found.sort((a, b) => b[1] - a[1]);

writeFileSync(`${L}/data/khmer-words.compound-candidates.tsv`,
  found.map(([w, c, parts]) => `${w}\t${c}\t${parts}`).join('\n') + (found.length ? '\n' : ''));

const cTotal = rows.filter((r) => r[2] === 'C').length;
console.log(`✅ ថ្នាក់ C សរុប ${cTotal} · សង្ស័យថាជាពាក្យផ្សំពីរ/បី ${found.length}`);
console.log('data/khmer-words.compound-candidates.tsv (មិនទាន់លុបចេញពី clean.tsv ទេ — ត្រូវពិនិត្យដោយដៃសិន)');
for (const [w, c, parts] of found.slice(0, 15)) console.log(`  ${w} (${c}) = ${parts}`);
