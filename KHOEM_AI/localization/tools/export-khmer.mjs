#!/usr/bin/env node
// export-khmer.mjs: merge ALL Khmer knowledge entries into ONE deduplicated file (read-only; writes only the output file).
// Same rule as search.ts: modules in order, the EARLIEST entry wins for a key; aliases already taken are dropped.
// usage (from KHOEM_AI/localization, after `npm run build`):
//   node --max-old-space-size=3072 tools/export-khmer.mjs ~/tmp/khmer-all.json [--gzip] [--mjs]
//   --gzip  also writes <out>.gz (about 15x smaller)      --mjs  writes `export default [...]` instead of plain JSON
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";
const args = process.argv.slice(2);
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const dist = path.resolve(val("--dist", "dist/src/khmer"));
const out = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--dist");
if (!out) { console.error("usage: node tools/export-khmer.mjs <out.json> [--gzip] [--mjs]"); process.exit(2); }
const norm = (s) => s.normalize("NFC").trim().toLowerCase().replace(/[?។!！？,，.៖;；:]+$/u, "").replace(/\s+/gu, " ");
const ORDER = [["data.js", "KHMER_ENTRIES"], ["data.extra.js", "KHMER_EXTRA_ENTRIES"], ["data.extra2.js", "KHMER_EXTRA2_ENTRIES"],
  ["data.extra3.js", "KHMER_EXTRA3_ENTRIES"], ["data.extra4.js", "KHMER_EXTRA4_ENTRIES"], ["data.extra5.js", "KHMER_EXTRA5_ENTRIES"],
  ["data.extra6.js", "KHMER_EXTRA6_ENTRIES"], ["data.extra7.js", "KHMER_EXTRA7_ENTRIES"]];
const seen = new Set(); const all = []; let raw = 0, droppedAliases = 0, droppedEntries = 0;
for (const [file, exp] of ORDER) {
  const fp = path.join(dist, file);
  if (!fs.existsSync(fp)) { console.log("skip (not built):", file); continue; }
  const arr = (await import(pathToFileURL(fp)))[exp] ?? [];
  let kept = 0;
  for (const [keys, answer] of arr) {
    raw++;
    const keep = [];
    for (const k of keys.split("|")) { const n = norm(k); if (!n) continue; if (seen.has(n)) { droppedAliases++; continue; } seen.add(n); keep.push(k.trim()); }
    if (!keep.length) { droppedEntries++; continue; }
    all.push([keep.join("|"), answer]); kept++;
  }
  console.log(`${file.padEnd(16)} entries ${String(arr.length).padStart(6)}  kept ${String(kept).padStart(6)}`);
}
const json = JSON.stringify(all);
fs.writeFileSync(path.resolve(out), args.includes("--mjs") ? "export default " + json + ";\n" : json);
console.log(`\nTOTAL: ${raw} entries read -> ${all.length} written | unique keys ${seen.size} | dropped entries ${droppedEntries} | dropped aliases ${droppedAliases}`);
console.log(`file: ${out}  ${(fs.statSync(path.resolve(out)).size / 1e6).toFixed(1)} MB`);
if (args.includes("--gzip")) { fs.writeFileSync(path.resolve(out) + ".gz", zlib.gzipSync(json, { level: 9 })); console.log(`gzip: ${out}.gz  ${(fs.statSync(path.resolve(out) + ".gz").size / 1e6).toFixed(1)} MB`); }
