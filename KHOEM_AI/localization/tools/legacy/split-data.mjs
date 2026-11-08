#!/usr/bin/env node
// split-data.mjs: rewrite src/khmer/data.ts with ONE entry per line (same data, readable git diffs).
// Run in KHOEM_AI/localization:  node tools/split-data.mjs  (dry-run)   node tools/split-data.mjs --write
import fs from "node:fs";
const file = "src/khmer/data.ts";
const src = fs.readFileSync(file, "utf8");
const head = "export const KHMER_ENTRIES: [string, string][] = ";
if (!src.startsWith(head)) { console.error("unexpected file start, abort"); process.exit(1); }
const body = src.slice(head.length).trim().replace(/;$/, "").replace(/,\s*\]$/, "]");
const arr = JSON.parse(body);
const out = head + "[\n" + arr.map((e) => "  " + JSON.stringify(e) + ",").join("\n") + "\n];\n";
const back = JSON.parse(out.slice(head.length).trim().replace(/;$/, "").replace(/,\s*\]$/, "]"));
if (JSON.stringify(back) !== JSON.stringify(arr)) { console.error("round-trip mismatch, abort"); process.exit(1); }
console.log(`entries: ${arr.length}  lines: ${out.split("\n").length}  bytes ${src.length} -> ${out.length}  (round-trip identical)`);
if (process.argv.includes("--write")) { fs.writeFileSync(file, out); console.log("written. Now: npm run verify"); } else console.log("dry-run only. Add --write to apply.");
