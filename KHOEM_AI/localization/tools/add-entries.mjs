#!/usr/bin/env node
// add-entries.mjs: check hand-typed Khmer entries against src/khmer/levels/** and (with --write) append the new ones.
// Replaces check-new-entries.mjs for the levels/ layout. Needs no build: it reads the .ts part files directly.
//
// Input (UTF-8, one entry per line):
//   key|alias2 :: answer
//   ["key|alias2","answer"],
//   blank lines and lines starting with # are ignored.
//
// Run from KHOEM_AI/localization:
//   node tools/add-entries.mjs new.txt            # report only
//   node tools/add-entries.mjs new.txt --write    # append new entries to the last level1 part (opens a new part when full)
// Options: --min 35 --max 80 (answer word range, warning only)
//
// A new entry is skipped if ANY of its keys already exists (normKhmer from src/khmer/norm.ts) or also appears as
// an earlier line of the same input. Entries go to level 1 because a hand-typed answer is unique to its entry.
// Limits per part: 1000 entries, 400000 bytes (the same limits tests/khmer-levels.test.ts enforces).
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const skipVals = new Set([val("--min"), val("--max")].filter(Boolean));
const file = args.find((a) => !a.startsWith("--") && !skipVals.has(a));
if (!file) { console.error("usage: node tools/add-entries.mjs <file.txt> [--write] [--min 35] [--max 80]"); process.exit(2); }
const MIN = Number(val("--min", 35)), MAX = Number(val("--max", 80));
const MAX_ENTRIES = 1000, MAX_BYTES = 400000;

const LEVELS = path.resolve("src/khmer/levels");
if (!fs.existsSync(path.join(LEVELS, "index.ts"))) { console.error("run from KHOEM_AI/localization (src/khmer/levels not found)"); process.exit(2); }

// same normalisation as src/khmer/norm.ts normKhmer
const norm = (s) => s.normalize("NFC").replace(/[​-‍﻿]/gu, "").trim().toLowerCase()
  .replace(/[?។!！？,，.៖;；:]+$/u, "").replace(/\s+/gu, " ");
const seg = new Intl.Segmenter("km", { granularity: "word" });
const words = (t) => [...seg.segment(t)].filter((s) => s.isWordLike).length;

// 1) existing keys: parse every entry line `  ["k","a"],` of every part file
const partFiles = [];
for (const lv of ["level1", "level2", "level3"]) {
  const d = path.join(LEVELS, lv);
  for (const f of fs.readdirSync(d).filter((n) => /^part-\d+\.ts$/.test(n)).sort()) partFiles.push({ lv, f, p: path.join(d, f) });
}
const existing = new Map();
let entryCount = 0;
for (const { lv, f, p } of partFiles) {
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!line.startsWith("  [")) continue;
    let pair; try { pair = JSON.parse(line.trim().replace(/,$/, "")); } catch { console.error(`cannot parse a line in ${lv}/${f}`); process.exit(2); }
    entryCount++;
    for (const k of pair[0].split("|")) { const n = norm(k); if (n && !existing.has(n)) existing.set(n, `${lv}/${f}`); }
  }
}
console.log(`existing: ${entryCount} entries, ${existing.size} keys in ${partFiles.length} parts`);

// 2) read the new entries
const good = [], skipped = [], warn = [], seenNew = new Map();
fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((raw, i) => {
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
  if (hit) { skipped.push(`line ${i + 1}: "${hit}" already exists (${existing.get(norm(hit)) ?? `input line ${seenNew.get(norm(hit))}`})`); return; }
  ks.forEach((k) => seenNew.set(norm(k), i + 1));
  const n = words(answer);
  if (n < MIN || n > MAX) warn.push(`line ${i + 1}: answer has ${n} words (wanted ${MIN}-${MAX})`);
  good.push([ks.join("|"), answer]);
});
console.log(`new & usable: ${good.length}   skipped (already exist): ${skipped.length}   warnings: ${warn.length}`);
skipped.slice(0, 40).forEach((s) => console.log("  SKIP ", s));
warn.slice(0, 40).forEach((s) => console.log("  WARN ", s));
if (!args.includes("--write")) process.exit(0);
if (!good.length) { console.log("nothing to write"); process.exit(0); }

// 3) append to the last level1 part; open the next part when the limits would be exceeded
const l1 = partFiles.filter((x) => x.lv === "level1");
let last = l1[l1.length - 1];
const numOf = (f) => Number(f.match(/part-(\d+)/)[1]);
const pad = (n) => String(n).padStart(3, "0");
const header = (n, count) => `// Khmer knowledge, level 1, part ${pad(n)}: ${count} entries. Earlier entries win on duplicate keys.\n` +
  `// Copyright (c) 2026 @KHOEM-AI. All rights reserved. See DATA-NOTICE.md. Origins of every entry: ORIGIN.tsv.\n`;
const readEntries = (p) => fs.readFileSync(p, "utf8").split("\n").filter((l) => l.startsWith("  ["));
const render = (n, lines) => header(n, lines.length) + `export const L1_${pad(n)}: [string, string][] = [\n${lines.join("\n")}\n];\n`;
const newLines = good.map(([k, a]) => `  [${JSON.stringify(k)},${JSON.stringify(a)}],`);

let cur = { n: numOf(last.f), p: last.p, lines: readEntries(last.p) };
const newParts = [];
let bytes = Buffer.byteLength(render(cur.n, cur.lines));
for (const l of newLines) {
  const add = Buffer.byteLength(l) + 1;
  if (cur.lines.length + 1 > MAX_ENTRIES || bytes + add > MAX_BYTES) {
    fs.writeFileSync(cur.p, render(cur.n, cur.lines));
    const n = cur.n + 1;
    cur = { n, p: path.join(LEVELS, "level1", `part-${pad(n)}.ts`), lines: [] };
    newParts.push(n); bytes = Buffer.byteLength(render(n, []));
  }
  cur.lines.push(l); bytes += add;
}
fs.writeFileSync(cur.p, render(cur.n, cur.lines));

// 4) register new parts in index.ts (import + KHMER_PARTS row, right after the previous level1 part)
if (newParts.length) {
  const ip = path.join(LEVELS, "index.ts");
  let s = fs.readFileSync(ip, "utf8");
  for (const n of newParts) {
    const prev = pad(n - 1), cu = pad(n);
    s = s.replace(`import { L1_${prev} } from "./level1/part-${prev}.js";\n`,
      (m) => `${m}import { L1_${cu} } from "./level1/part-${cu}.js";\n`);
    s = s.replace(`  { level: 1, name: "level1/part-${prev}", entries: L1_${prev} },\n`,
      (m) => `${m}  { level: 1, name: "level1/part-${cu}", entries: L1_${cu} },\n`);
  }
  fs.writeFileSync(ip, s);
  console.log(`opened new part(s): ${newParts.map((n) => "level1/part-" + pad(n)).join(", ")} (registered in index.ts)`);
}
console.log(`appended ${good.length} entries (last part: level1/part-${pad(cur.n)}). Now run: npm run build && npm run verify`);
