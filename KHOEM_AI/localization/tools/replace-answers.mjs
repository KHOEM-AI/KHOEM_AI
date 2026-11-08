#!/usr/bin/env node
// replace-answers.mjs: replace the ANSWER of existing entries in src/khmer/levels/ (any level).
// Input: lines  ["key|alias","new answer"],   (the key string must match the existing entry exactly)
// Usage (from KHOEM_AI/localization):
//   node tools/replace-answers.mjs fixes.txt           # dry run: shows what would change
//   node tools/replace-answers.mjs fixes.txt --write   # apply (all or nothing), then regenerate README numbers
// The entry stays in its part and level. If the new answer makes the entries of a part larger than 400000 bytes, nothing is written.
import fs from "node:fs";
import { levelsDir, loadParts, partText, regenerate, entryBytes, MAX_BYTES } from "./lib/khmer-levels.mjs";
const file = process.argv[2];
const write = process.argv.includes("--write");
if (!file || file.startsWith("--")) { console.error("usage: node tools/replace-answers.mjs <file.txt> [--write]"); process.exit(2); }
const seg = new Intl.Segmenter("km", { granularity: "word" });
const words = (t) => [...seg.segment(t)].filter((s) => s.isWordLike).length;
const repl = new Map();
for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  const l = raw.trim(); if (!l.startsWith("[")) continue;
  try { const [k, a] = JSON.parse(l.replace(/,\s*$/, "")); repl.set(k, a); } catch { console.error("bad line: " + l.slice(0, 60)); process.exit(1); }
}
const dir = levelsDir();
const used = new Set(); const changedParts = []; let changed = 0, tooBig = 0;
for (const p of loadParts(dir)) {
  let touched = false;
  const entries = p.entries.map(([k, a]) => {
    if (!repl.has(k)) return [k, a];
    used.add(k); const n = repl.get(k);
    console.log(`${words(a)} -> ${words(n)} words  ${k.split("|")[0]}  (${p.name})`); changed++; touched = true;
    return [k, n];
  });
  if (touched) {
    const nnn = /part-(\d{3})$/.exec(p.name)[1];
    const text = partText(p.level, nnn, entries);
    if (entryBytes(entries) > MAX_BYTES) { console.log(`TOO BIG: ${p.name} would hold ${entryBytes(entries)} entry bytes (limit ${MAX_BYTES})`); tooBig++; }
    changedParts.push({ file: p.file, text });
  }
}
const missing = [...repl.keys()].filter((k) => !used.has(k));
missing.forEach((k) => console.log("NOT FOUND: " + k));
console.log(`replaced: ${changed}   not found: ${missing.length}   parts too big: ${tooBig}`);
if (write && changed && !missing.length && !tooBig) {
  for (const c of changedParts) fs.writeFileSync(c.file, c.text);
  regenerate(dir);
  console.log("written. Now run: npm run verify");
} else if (write) console.log("NOT written (fix the problems above first).");
