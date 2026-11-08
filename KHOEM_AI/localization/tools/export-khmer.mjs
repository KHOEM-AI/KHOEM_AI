#!/usr/bin/env node
// export-khmer.mjs: merge ALL Khmer knowledge entries into ONE deduplicated file (read-only; writes only the output file).
// Reads src/khmer/levels (TypeScript source). Same rule as search.ts: level 1, 2, 3 in order, the EARLIEST entry wins for a key; aliases already taken are dropped.
// usage (from KHOEM_AI/localization):
//   node --max-old-space-size=3072 tools/export-khmer.mjs ~/tmp/khmer-all.json [--gzip] [--mjs]
//   --gzip  also writes <out>.gz (about 15x smaller)      --mjs  writes `export default [...]` instead of plain JSON
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { levelsDir, loadParts, norm } from "./lib/khmer-levels.mjs";
const args = process.argv.slice(2);
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const out = args.find((a) => !a.startsWith("--"));
if (!out) { console.error("usage: node tools/export-khmer.mjs <out.json> [--gzip] [--mjs]"); process.exit(2); }
const seen = new Set(); const all = []; let raw = 0, droppedAliases = 0, droppedEntries = 0;
for (const p of loadParts(levelsDir())) {
  const arr = p.entries;
  let kept = 0;
  for (const [keys, answer] of arr) {
    raw++;
    const keep = [];
    for (const k of keys.split("|")) { const n = norm(k); if (!n) continue; if (seen.has(n)) { droppedAliases++; continue; } seen.add(n); keep.push(k.trim()); }
    if (!keep.length) { droppedEntries++; continue; }
    all.push([keep.join("|"), answer]); kept++;
  }
  console.log(`${p.name.padEnd(18)} entries ${String(arr.length).padStart(6)}  kept ${String(kept).padStart(6)}`);
}
const json = JSON.stringify(all);
fs.writeFileSync(path.resolve(out), args.includes("--mjs") ? "export default " + json + ";\n" : json);
console.log(`\nTOTAL: ${raw} entries read -> ${all.length} written | unique keys ${seen.size} | dropped entries ${droppedEntries} | dropped aliases ${droppedAliases}`);
console.log(`file: ${out}  ${(fs.statSync(path.resolve(out)).size / 1e6).toFixed(1)} MB`);
if (args.includes("--gzip")) { fs.writeFileSync(path.resolve(out) + ".gz", zlib.gzipSync(json, { level: 9 })); console.log(`gzip: ${out}.gz  ${(fs.statSync(path.resolve(out) + ".gz").size / 1e6).toFixed(1)} MB`); }
