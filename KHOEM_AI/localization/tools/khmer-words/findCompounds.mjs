import { readFileSync, writeFileSync } from 'node:fs';

// Report-only: flags tier-C words that split exactly into 2-3 already-known
// tier A/B words (likely a segmenter merge, e.g. "និយាយ"+"ល្អ"). Writes
// data/khmer-words.compound-candidates.tsv for manual review; changes
// nothing in khmer-words.clean.tsv. Run after tier.mjs.
const HOME = process.env.HOME;
const L = `${HOME}/KHOEM_AI/KHOEM_AI/localization`;
const MIN_PART = 2; // minimum Khmer characters per piece, avoids 1-char false splits

const rows = readFileSync(`${L}/data/khmer-words.clean.tsv`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { const [w, c, tier] = l.split('\t'); return [w, Number(c) || 0, tier]; });

const known = new Set();
for (const [w, , tier] of rows) if (tier === 'A' || tier === 'B') known.add(w);

function split2or3(w) {
  const n = w.length;
  for (let i = MIN_PART; i <= n - MIN_PART; i++) {
    const a = w.slice(0, i);
    if (!known.has(a)) continue;
    const b = w.slice(i);
    if (known.has(b)) return [a, b];
    for (let j = i + MIN_PART; j <= n - MIN_PART; j++) {
      const b2 = w.slice(i, j), c2 = w.slice(j);
      if (known.has(b2) && known.has(c2)) return [a, b2, c2];
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
