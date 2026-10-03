// Deterministic word-list builder. Reads LOCAL raw VOA JSON (never committed),
// emits only a frequency-filtered token list. No source text is written out.
// Usage: node corpus-sample/build-vocab.mjs [rawDir] [outFile]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.argv[2] ?? 'corpus-sample/raw/voa_extracted/khm_khmer_voanews';
const out = process.argv[3] ?? path.join(os.tmpdir(), 'km-vocab.candidate.json');
const MIN_FREQ = 5;

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.json')) yield p;
  }
}
function* strings(x) {
  if (typeof x === 'string') yield x;
  else if (Array.isArray(x)) for (const y of x) yield* strings(y);
}

const counts = new Map();
let files = 0;
for (const f of walk(root)) {
  let rec;
  try { rec = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  files++;
  for (const t of strings(rec.tokens)) {
    const w = t.normalize('NFC').replace(/\p{Cf}/gu, '').trim();
    if (w) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
}

const keep = (w, n) =>
  n >= MIN_FREQ &&
  /\p{Script=Khmer}/u.test(w) &&
  !/[A-Za-z0-9\s]/u.test(w) &&                   // no Latin, ASCII digits, whitespace
  !/[\p{P}\p{S}]/u.test(w) &&                   // no punctuation or symbols
  !/^\p{M}+$/u.test(w) &&                        // no standalone combining marks
  !/^[\u1780-\u17A2\u17E0-\u17E9]$/u.test(w); // no single consonant / single digit


const words = [...counts].filter(([w, n]) => keep(w, n))
  .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
  .map(([w]) => w);

const body = JSON.stringify({
  params: {
    minFreq: MIN_FREQ,
    normalization: 'NFC',
    formatCharactersRemoved: true,
    punctuationRemoved: true,
    symbolsRemoved: true,
    standaloneMarksRemoved: true,
  },
  files, count: words.length, words,
});
fs.writeFileSync(out, body);
console.log({ files, uniqueTokens: counts.size, kept: words.length, out,
  sha256: crypto.createHash('sha256').update(body).digest('hex') });
