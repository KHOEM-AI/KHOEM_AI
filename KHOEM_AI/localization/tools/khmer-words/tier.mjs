import { readFileSync, writeFileSync, existsSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const HOME = process.env.HOME;
const L = `${HOME}/KHOEM_AI/KHOEM_AI/localization`;
const A = `${HOME}/ai-project/AI`;

const TB = Number(process.env.TIER_B) || 5;
const TC = Number(process.env.TIER_C) || 2;
const C = '[\\u1780-\\u17A2]';
const IV = '[\\u17A3-\\u17B3]';
const SIGN = '[\\u17C6-\\u17C8\\u17CB-\\u17D1\\u17D3\\u17DD]';
const SYL = `(?:${C}(?:\\u17D2${C})*[\\u17C9\\u17CA]?[\\u17B6-\\u17C5]?${SIGN}*|${IV}${SIGN}*)`;
const VALID = new RegExp(`^${SYL}+$`);

const tests = [['ប្រទេសកម្ពុជា', true], ['ប៉ុន្តែ', true], ['អ៊ី', true], ['ត៍្ល', false], ['ចម្លេី', false]];
for (const [w, ok] of tests) {
  if (VALID.test(w) !== ok) { console.log(`❌ តេស្តរចនាសម្ព័ន្ធខុស: ${w} — ឈប់ (មិនទាន់សរសេរអ្វី)`); process.exit(1); }
}

const raw = readFileSync(`${L}/data/khmer-words.tsv`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { const [w, c] = l.split('\t'); return [w, Number(c) || 0]; });
const rawSet = new Set(raw.map(([w]) => w));

const wikt = new Set();
const wf = `${HOME}/khoem-corpora/kmwiktionary.xml`;
if (existsSync(wf)) {
  const rl = createInterface({ input: createReadStream(wf, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    const m = line.match(/<title>([^<]+)<\/title>/);
    if (m) { const t = m[1].trim().normalize('NFC'); if (VALID.test(t)) wikt.add(t); }
  }
}

const wiki = new Set();
const kw = `${HOME}/khoem-corpora/kmwiki.xml`;
if (existsSync(kw)) {
  const rl2 = createInterface({ input: createReadStream(kw, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl2) {
    const m = line.match(/<title>([^<]+)<\/title>/);
    if (m) { const t = m[1].trim().normalize('NFC'); if (VALID.test(t)) wiki.add(t); }
  }
}

const voa = new Set();
try {
  for (const line of readFileSync(`${A}/data/voa-wordlist.tsv`, 'utf8').split('\n')) {
    const [w, c] = line.split('\t');
    if (w && Number(c) >= 5 && VALID.test(w)) voa.add(w);
  }
} catch { /* optional */ }

const stat = { A: 0, B: 0, C: 0, dropped_invalid: 0, dropped_rare: 0 };
const rows = [];
for (const [w, c] of raw) {
  if (!VALID.test(w)) { stat.dropped_invalid++; continue; }
  let tier;
  if (wikt.has(w) || voa.has(w) || wiki.has(w)) tier = 'A';
  else if (c >= TB) tier = 'B';
  else if (c >= TC) tier = 'C';
  else { stat.dropped_rare++; continue; }
  stat[tier]++;
  rows.push([w, c, tier]);
}
for (const w of wikt) if (!rawSet.has(w)) { stat.A++; rows.push([w, 0, 'A']); }
for (const w of wiki) if (!rawSet.has(w) && !wikt.has(w)) { stat.A++; rows.push([w, 0, 'A']); }

rows.sort((x, y) => x[2].localeCompare(y[2]) || y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
writeFileSync(`${L}/data/khmer-words.clean.tsv`, rows.map((r) => r.join('\t')).join('\n') + '\n');

let stats = {};
try { stats = JSON.parse(readFileSync(`${L}/data/khmer-words.stats.json`, 'utf8')); } catch { /* new */ }
stats.clean = { total: rows.length, ...stat, wiktionary_titles: wikt.size, wikipedia_titles: wiki.size, columns: 'word, count, tier (A trusted, B seen ' + TB + '+, C seen ' + TC + '-' + (TB - 1) + ')' };
writeFileSync(`${L}/data/khmer-words.stats.json`, JSON.stringify(stats, null, 2) + '\n');

console.log(`✅ ស្អាតសរុប : ${rows.length}`);
console.log(`ថ្នាក់ A (វិគីវចនានុក្រម/VOA) : ${stat.A}   (វិគីវចនានុក្រម៖ ${wikt.size} · វិគីភីឌា៖ ${wiki.size})`);
console.log(`ថ្នាក់ B (ឃើញ ≥5)          : ${stat.B}`);
console.log(`ថ្នាក់ C (ឃើញ 2-4)         : ${stat.C}`);
console.log(`ដកចេញ ឃើញ 1 ដង           : ${stat.dropped_rare}`);
console.log(`ដកចេញ រចនាសម្ព័ន្ធខុស       : ${stat.dropped_invalid}`);
const sample = (t) => { const x = rows.filter((r) => r[2] === t); const s = Math.max(1, Math.floor(x.length / 12)); return x.filter((_, i) => i % s === 0).slice(0, 12).map((r) => r[0]).join(' '); };
console.log('ឧទាហរណ៍ A :', sample('A'));
console.log('ឧទាហរណ៍ B :', sample('B'));
console.log('ឧទាហរណ៍ C :', sample('C'));
