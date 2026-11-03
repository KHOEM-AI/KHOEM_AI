#!/usr/bin/env node
// check-new-entries.mjs: check hand-typed Khmer entries against what already exists.
//
// Input file (one entry per line, UTF-8), either format:
//   key|alias2|alias3 :: answer
//   ["key|alias2","answer"],            (the same JSON-array line format used in khmer.mjs / data.extra.*.ts)
//   Blank lines and lines starting with # are ignored.
//
// Usage (run from KHOEM_AI/localization, after `npm run build`):
//   node tools/check-new-entries.mjs new.txt            # report only
//   node tools/check-new-entries.mjs new.txt --write    # append the NEW ones to src/khmer/data.extra.5.ts
//   node tools/check-new-entries.mjs new.txt --also ../../khmer_base.mjs   # also compare with another dataset module
//
// Rules: an entry is skipped if ANY of its keys already exists (same normalisation as src/khmer/search.ts).
// Answers are reported when they are far from ~50 words (default 35..80, change with --min/--max).

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--also" && args[args.indexOf(a) - 1] !== "--min" && args[args.indexOf(a) - 1] !== "--max");
const flag = (n) => args.includes(n);
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
if (!file) { console.error("usage: node tools/check-new-entries.mjs <file.txt> [--write] [--also module.mjs] [--min 35] [--max 80]"); process.exit(2); }
const MIN = Number(val("--min", 35)), MAX = Number(val("--max", 80));

const norm = (s) => s.normalize("NFC").trim().toLowerCase().replace(/[?។!！？,，.៖;；:]+$/u, "").replace(/\s+/gu, " ");
const seg = new Intl.Segmenter("km", { granularity: "word" });
const words = (t) => [...seg.segment(t)].filter((s) => s.isWordLike).length;

// 1) existing keys from the compiled repo data (src/khmer/data*.ts -> dist/src/khmer/*.js)
const distDir = path.resolve("dist/src/khmer");
const existing = new Map(); // key -> where
const addAll = (entries, where) => { for (const [keys] of entries) for (const k of keys.split("|")) { const n = norm(k); if (n && !existing.has(n)) existing.set(n, where); } };
try {
  addAll((await import(pathToFileURL(path.join(distDir, "data.js")))).KHMER_ENTRIES, "data.ts");
  addAll((await import(pathToFileURL(path.join(distDir, "data.extra.js")))).KHMER_EXTRA_ENTRIES, "data.extra");
} catch (e) { console.error("Cannot load dist/src/khmer. Run `npm run build` in localization first.\n" + e.message); process.exit(2); }

// 2) optional extra dataset modules
for (let i = 0; i < args.length; i++) if (args[i] === "--also") {
  const m = await import(pathToFileURL(path.resolve(args[i + 1])));
  // use KHMER_DATASET_V2 / default if present, else EVERY exported array of ["keys","answer"] pairs (e.g. EXTRA_ENTRIES_10000, ..._PERSONA_CLAIMS)
  const isPairs = (v) => Array.isArray(v) && v.length && Array.isArray(v[0]) && typeof v[0][0] === "string";
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

// 4) write only the new ones
if (flag("--write")) {
  if (!good.length) { console.log("nothing to write"); process.exit(0); }
  const part = path.resolve("src/khmer/data.extra.5.ts");
  const body = good.map(([k, a]) => `  [${JSON.stringify(k)}, ${JSON.stringify(a)}],`).join("\n");
  let head = "// Hand-typed Khmer entries (check-new-entries.mjs). Earlier entries win on duplicate keys.\nexport const KHMER_EXTRA_PART_5: [string, string][] = [\n";
  let prev = "";
  if (fs.existsSync(part)) { prev = fs.readFileSync(part, "utf8").replace(/\n\];\s*$/, "\n"); head = ""; }
  fs.writeFileSync(part, (prev || head) + body + "\n];\n");

  const agg = path.resolve("src/khmer/data.extra.ts");
  let s = fs.readFileSync(agg, "utf8");
  if (!s.includes("KHMER_EXTRA_PART_5")) {
    s = s.replace(/(import \{ KHMER_EXTRA_PART_4 \} from "\.\/data\.extra\.4\.js";)/, `$1\nimport { KHMER_EXTRA_PART_5 } from "./data.extra.5.js";`)
         .replace(/(\s*\.\.\.KHMER_EXTRA_PART_4,)/, `$1\n  ...KHMER_EXTRA_PART_5,`);
    fs.writeFileSync(agg, s);
  }
  console.log(`appended ${good.length} entries to src/khmer/data.extra.5.ts. Now run: npm run verify`);
}
