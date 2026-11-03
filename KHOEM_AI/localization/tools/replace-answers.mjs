#!/usr/bin/env node
// replace-answers.mjs: replace the ANSWER of existing hand-typed entries in src/khmer/data.extra.5.ts
// Input: lines  ["key|alias","new answer"],   (the key must match the existing entry exactly)
// Usage (from KHOEM_AI/localization):
//   node tools/replace-answers.mjs expand16.txt           # dry run: shows what would change
//   node tools/replace-answers.mjs expand16.txt --write   # apply
import fs from "node:fs";
import path from "node:path";
const file = process.argv[2];
const write = process.argv.includes("--write");
if (!file) { console.error("usage: node tools/replace-answers.mjs <file.txt> [--write]"); process.exit(2); }
const target = path.resolve("src/khmer/data.extra.5.ts");
const seg = new Intl.Segmenter("km", { granularity: "word" });
const words = (t) => [...seg.segment(t)].filter((s) => s.isWordLike).length;
const repl = new Map();
for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  const l = raw.trim(); if (!l.startsWith("[")) continue;
  try { const [k, a] = JSON.parse(l.replace(/,\s*$/, "")); repl.set(k, a); } catch { console.error("bad line: " + l.slice(0, 60)); process.exit(1); }
}
const re = /^(\s*\[)("(?:[^"\\]|\\.)*")(,\s*)("(?:[^"\\]|\\.)*")(\],\s*)$/;
const used = new Set(); let changed = 0;
const out = fs.readFileSync(target, "utf8").split("\n").map((line) => {
  const m = line.match(re); if (!m) return line;
  const key = JSON.parse(m[2]); if (!repl.has(key)) return line;
  used.add(key); const oldA = JSON.parse(m[4]), newA = repl.get(key);
  console.log(`${words(oldA)} -> ${words(newA)} words  ${key.split("|")[0]}`); changed++;
  return m[1] + m[2] + m[3] + JSON.stringify(newA) + m[5];
});
const missing = [...repl.keys()].filter((k) => !used.has(k));
missing.forEach((k) => console.log("NOT FOUND: " + k));
console.log(`replaced: ${changed}   not found: ${missing.length}`);
if (write && changed && !missing.length) { fs.writeFileSync(target, out.join("\n")); console.log("written. Now run: npm run verify"); }
else if (write) console.log("NOT written (some keys were not found).");
