#!/usr/bin/env node
// check-new-entries.mjs: check hand-typed Khmer entries against what already exists.
//
// Input file (one entry per line, UTF-8), either format:
//   key|alias2|alias3 :: answer
//   ["key|alias2","answer"],            (the same JSON-array line format used in khmer.mjs / data.extra.*.ts)
//   Blank lines and lines starting with # are ignored.
//
// Usage (run from KHOEM_AI/localization; reads the TypeScript source in src/khmer/levels, no build needed):
//   node tools/check-new-entries.mjs new.txt            # report only
//   node tools/check-new-entries.mjs new.txt --write    # append the NEW ones to the END of level 1 (src/khmer/levels/), then regenerate index.ts/README/ORIGIN
//   node tools/check-new-entries.mjs new.txt --also ../../khmer_base.mjs   # also compare with another dataset module
//
// Rules: an entry is skipped if ANY of its keys already exists (same normalisation as src/khmer/norm.ts).
// Answers are reported when they are far from ~50 words (default 35..80, change with --min/--max).

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { levelsDir, loadParts, norm, isPairs, appendToLevel1, appendOrigin, regenerate } from "./lib/khmer-levels.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--also" && args[args.indexOf(a) - 1] !== "--min" && args[args.indexOf(a) - 1] !== "--max");
const flag = (n) => args.includes(n);
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
if (!file) { console.error("usage: node tools/check-new-entries.mjs <file.txt> [--write] [--also module.mjs] [--min 35] [--max 80]"); process.exit(2); }
const MIN = Number(val("--min", 35)), MAX = Number(val("--max", 80));

const seg = new Intl.Segmenter("km", { granularity: "word" });
const words = (t) => [...seg.segment(t)].filter((s) => s.isWordLike).length;

// 1) existing keys from the TypeScript source parts (src/khmer/levels)
const dir = levelsDir();
const existing = new Map(); // key -> where
const addAll = (entries, where) => { for (const [keys] of entries) for (const k of keys.split("|")) { const n = norm(k); if (n && !existing.has(n)) existing.set(n, where); } };
for (const p of loadParts(dir)) addAll(p.entries, p.name);

// 2) optional extra dataset modules
for (let i = 0; i < args.length; i++) if (args[i] === "--also") {
  const m = await import(pathToFileURL(path.resolve(args[i + 1])));
  // use KHMER_DATASET_V2 / default if present, else EVERY exported array of ["keys","answer"] pairs (e.g. EXTRA_ENTRIES_10000, ..._PERSONA_CLAIMS)
  const named = m.KHMER_DATASET_V2 ?? m.default;
  const arrays = isPairs(named) ? [["default", named]] : Object.entries(m).filter(([, v]) => isPairs(v));
  if (!arrays.length) { console.error(`--also ${args[i + 1]}: no array of ["key","answer"] pairs exported`); process.exit(2); }
  for (const [name, arr] of arrays) { addAll(arr, `${path.basename(args[i + 1])}:${name}`); console.log(`  loaded ${name} (${arr.length}) from ${path.basename(args[i + 1])}`); }
}
console.log(`existing keys loaded: ${existing.size}`);

// 3) read the new entries
const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
const good = [], skipped = [], warn = [], seenNew = new Map();
lines.forEach((raw, i) => {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return;
  let keys, answer;
  if (line.startsWith("[")) {
    try { [keys, answer] = JSON.parse(line.replace(/,\s*$/, "")); } catch { warn.push(`line ${i + 1}: not valid ["key","answer"] JSON`); return; }
    if (typeof keys !== "string" || typeof answer !== "string") { warn.push(`line ${i + 1}: key/answer must be strings`); return; }
  } else {
    const at = line.indexOf(" :: ");
    if (at < 1) { warn.push(`line ${i + 1}: missing " :: " separator`); return; }
    keys = line.slice(0, at).trim(); answer = line.slice(at + 4).trim();
  }
  if (!answer) { warn.push(`line ${i + 1}: empty answer`); return; }
  const ks = keys.split("|").map((k) => k.trim()).filter(Boolean);
  const hit = ks.find((k) => existing.has(norm(k))) ?? ks.find((k) => seenNew.has(norm(k)));
  if (hit) {
    const w = existing.get(norm(hit)) ?? `new file line ${seenNew.get(norm(hit))}`;
    skipped.push(`line ${i + 1}: "${hit}" already exists (${w})`);
    return;
  }
  ks.forEach((k) => seenNew.set(norm(k), i + 1));
  const n = words(answer);
  if (n < MIN || n > MAX) warn.push(`line ${i + 1}: answer has ${n} words (wanted ${MIN}-${MAX})`);
  good.push([ks.join("|"), answer]);
});

// 3b) words in the new answers that are not in the known Khmer word list (data/khmer-words.clean.tsv)
const vocabFile = path.resolve("data/khmer-words.clean.tsv");
if (fs.existsSync(vocabFile)) {
  const vocab = new Set(fs.readFileSync(vocabFile, "utf8").split("\n").map((l) => l.split("\t")[0].normalize("NFC")));
  const unk = new Map(); let total = 0;
  for (const [k, a] of good) for (const w of [...seg.segment(k + " " + a)].filter((s) => s.isWordLike).map((s) => s.segment)) {
    if (!/[\u1780-\u17FF]/u.test(w)) continue; total++;
    if (!vocab.has(w.normalize("NFC"))) unk.set(w, (unk.get(w) || 0) + 1);
  }
  const top = [...unk.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w, c]) => `${w}×${c}`).join("  ");
  console.log(`Khmer words: ${total}   not in word list: ${[...unk.values()].reduce((a, b) => a + b, 0)} (${unk.size} distinct)${top ? "\n  UNKNOWN: " + top : ""}`);
}
console.log(`new & usable: ${good.length}   skipped (already exist): ${skipped.length}   warnings: ${warn.length}`);
skipped.slice(0, 40).forEach((s) => console.log("  SKIP ", s));
warn.slice(0, 40).forEach((s) => console.log("  WARN ", s));

// 4) write only the new ones: appended to the END of level 1 (new part when 1000 entries / 400000 bytes is reached)
if (flag("--write")) {
  if (!good.length) { console.log("nothing to write"); process.exit(0); }
  const before = loadParts(dir).filter((p) => p.level === 1);
  const firstPart = before[before.length - 1];
  const touched = appendToLevel1(dir, good);
  // ORIGIN.tsv rows: one per new entry, with its part and 1-based index inside that part
  const originFile = path.join(dir, "ORIGIN.tsv");
  const handBefore = fs.readFileSync(originFile, "utf8").split("\n").filter((l) => l.split("\t")[3] === "hand-typed").length;
  const after = loadParts(dir).filter((p) => touched.includes(p.name));
  let origin = handBefore + 1, left = good.length;
  for (const p of after) {
    const had = p.name === firstPart?.name ? firstPart.entries.length : 0;
    const add = Math.min(left, p.entries.length - had);
    if (add > 0) { appendOrigin(dir, p.name, had + 1, add, origin); origin += add; left -= add; }
  }
  regenerate(dir);
  console.log(`appended ${good.length} entries to ${touched.join(", ")} and regenerated index.ts, README.md, ORIGIN.tsv. Now run: npm run verify`);
}
