import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const HOME = process.env.HOME;
const L = `${HOME}/KHOEM_AI/KHOEM_AI/localization`;
const RAW = `${L}/data/khmer-words.tsv`;
const STATS = `${L}/data/khmer-words.stats.json`;
const KEEP_MIN = 3;
const MAX_MAP = 4000000;
const WORD = /^[\u1780-\u17B3][\u1780-\u17D3\u17DD]+$/;
const KM_RUN = /[\u1780-\u17FF]+/g;

if (typeof Intl.Segmenter !== 'function') { console.log('❌ node នេះគ្មាន Intl.Segmenter'); process.exit(1); }
const seg = new Intl.Segmenter('km', { granularity: 'word' });

const counts = new Map();
if (existsSync(RAW)) {
  for (const l of readFileSync(RAW, 'utf8').split('\n')) {
    if (!l) continue;
    const [w, c] = l.split('\t');
    counts.set(w, Number(c) || 0);
  }
}
const before = counts.size;
let lines = 0, chars = 0, rounds = 0;
const t0 = Date.now();

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  lines++;
  chars += line.length;
  const runs = line.match(KM_RUN);
  if (runs) {
    for (const run of runs) {
      for (const s of seg.segment(run)) {
        if (s.isWordLike && WORD.test(s.segment)) counts.set(s.segment, (counts.get(s.segment) || 0) + 1);
      }
    }
  }
  if (counts.size > MAX_MAP) {
    for (const [w, c] of counts) if (c <= 1) counts.delete(w);
    rounds++;
  }
  if (lines % 200000 === 0) {
    console.error(`… ${lines} បន្ទាត់ · ${(chars / 1e6).toFixed(0)}M តួអក្សរ · ${counts.size} ពាក្យ · ${((Date.now() - t0) / 60000).toFixed(1)} នាទី`);
  }
}

const kept = [...counts].filter(([, c]) => c >= KEEP_MIN).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
writeFileSync(RAW, kept.map(([w, c]) => `${w}\t${c}`).join('\n') + '\n');
const ge = (n) => kept.filter(([, c]) => c >= n).length;

let stats = {};
try { stats = JSON.parse(readFileSync(STATS, 'utf8')); } catch { /* new */ }
delete stats.seen_2_plus;
Object.assign(stats, {
  generated: new Date().toISOString().slice(0, 10),
  total: kept.length, seen_5_plus: ge(5), seen_10_plus: ge(10), seen_20_plus: ge(20),
  cc100: { lines, chars, prune_rounds: rounds, keep_min: KEEP_MIN },
  note: 'Words cut by ICU (Intl.Segmenter km). Raw list keeps words seen 3+ times. Not checked against a dictionary.',
});
writeFileSync(STATS, JSON.stringify(stats, null, 2) + '\n');

console.log(`\n✅ អាន ${lines} បន្ទាត់ · ${((Date.now() - t0) / 60000).toFixed(1)} នាទី`);
console.log(`ពាក្យមុន ${before} → រក្សា (ឃើញ ≥3) ${kept.length}`);
console.log(`ឃើញ ≥5: ${ge(5)} · ≥20: ${ge(20)} · ≥100: ${ge(100)}`);
