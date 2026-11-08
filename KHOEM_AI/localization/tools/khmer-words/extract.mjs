import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';

const HOME = process.env.HOME;
const L = `${HOME}/KHOEM_AI/KHOEM_AI/localization`;
const A = `${HOME}/ai-project/AI`;
const KM_RUN = /[\u1780-\u17FF]+/g;
// word = starts with a Khmer letter, then letters / vowel signs / coeng; no digits or punctuation
const WORD = /^[\u1780-\u17B3][\u1780-\u17D3\u17DD]+$/;
const TEXT_EXT = /\.(txt|md|json|tsv|csv|html|xml|mjs|ts|js)$/i;

if (typeof Intl.Segmenter !== 'function') { console.log('❌ node នេះគ្មាន Intl.Segmenter'); process.exit(1); }
const seg = new Intl.Segmenter('km', { granularity: 'word' });
const counts = new Map();
const bump = (w, n = 1) => counts.set(w, (counts.get(w) || 0) + n);

function addText(text) {
  const runs = new Map();
  for (const r of text.match(KM_RUN) || []) runs.set(r, (runs.get(r) || 0) + 1);
  for (const [run, n] of runs) {
    for (const s of seg.segment(run)) {
      if (s.isWordLike && WORD.test(s.segment)) bump(s.segment, n);
    }
  }
}
function addWordlist(text) {
  for (const line of text.split('\n')) {
    const [w, c] = line.split('\t');
    const word = (w || '').trim();
    if (WORD.test(word)) bump(word, Number(c) > 0 ? Number(c) : 1);
  }
}
function walk(p, out = []) {
  let st;
  try { st = statSync(p); } catch { return out; }
  if (st.isDirectory()) {
    for (const n of readdirSync(p)) {
      if (n === 'node_modules' || n === '.git' || n === 'dist') continue;
      walk(join(p, n), out);
    }
  } else if (TEXT_EXT.test(p)) out.push(p);
  return out;
}

const files = [];
for (const f of [
  `${L}/staging-ai-languages/khmer.clean14.mjs`, `${L}/staging-ai-languages/khmer.merged.mjs`,
  `${A}/data/voa-wordlist.tsv`,
]) if (existsSync(f)) files.push(f);
try {
  for (const n of readdirSync(`${A}/src/ai`)) if (/^(khmer|lexicon).*\.mjs$/.test(n)) files.push(`${A}/src/ai/${n}`);
} catch { /* ignore */ }
for (const arg of process.argv.slice(2)) files.push(...walk(arg));

// every Khmer knowledge part (src/khmer/levels: level1, level2, level3)
files.push(...walk(`${L}/src/khmer/levels`).filter((f) => /part-\d+\.ts$/.test(f)));

const uniq = [...new Set(files)];
const t0 = Date.now();
let done = 0;
const BIG = 30 * 1024 * 1024;
for (const f of uniq) {
  let size = 0;
  try { size = statSync(f).size; } catch { continue; }
  if (size > BIG) {
    const rl = createInterface({ input: createReadStream(f, { encoding: 'utf8' }), crlfDelay: Infinity });
    let buf = [];
    let len = 0;
    for await (const line of rl) {
      if (!/[\u1780-\u17FF]/.test(line)) continue;
      buf.push(line);
      len += line.length;
      if (len > 2000000) { addText(buf.join('\n')); buf = []; len = 0; }
    }
    if (buf.length) addText(buf.join('\n'));
  } else {
    let text = '';
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    if (/wordlist/i.test(f)) addWordlist(text); else addText(text);
  }
  done++;
  console.log('… ' + done + '/' + uniq.length + ' ' + f.split('/').pop() + ' · ' + counts.size + ' ពាក្យ');
}

const list = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
mkdirSync(`${L}/data`, { recursive: true });
writeFileSync(`${L}/data/khmer-words.tsv`, list.map(([w, c]) => `${w}\t${c}`).join('\n') + '\n');
const ge = (n) => list.filter(([, c]) => c >= n).length;
const stats = {
  generated: new Date().toISOString().slice(0, 10),
  files: done, total: list.length, seen_2_plus: ge(2), seen_5_plus: ge(5), seen_10_plus: ge(10),
  note: 'Words cut by ICU (Intl.Segmenter km). Not checked against a dictionary: names and fragments are included.',
};
writeFileSync(`${L}/data/khmer-words.stats.json`, JSON.stringify(stats, null, 2) + '\n');

console.log(`\n✅ ស្កេន ${done} ឯកសារ · ${((Date.now() - t0) / 1000).toFixed(0)} វិនាទី`);
console.log(`ពាក្យខុសគ្នាសរុប : ${stats.total}`);
console.log(`ឃើញ ≥2 ដង       : ${stats.seen_2_plus}`);
console.log(`ឃើញ ≥5 ដង       : ${stats.seen_5_plus}`);
console.log(`ឃើញ ≥10 ដង      : ${stats.seen_10_plus}`);
console.log('ពាក្យញឹកញាប់បំផុត :', list.slice(0, 15).map(([w]) => w).join(' '));
const singles = list.filter(([, c]) => c === 1).map(([w]) => w);
const step = Math.max(1, Math.floor(singles.length / 15));
console.log('ឧទាហរណ៍ឃើញ 1 ដង  :', singles.filter((_, i) => i % step === 0).slice(0, 15).join(' '));
