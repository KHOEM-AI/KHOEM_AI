#!/usr/bin/env node
// compare-answers.mjs: for entries of the big phone files, is the ANSWER text in the repo the same? (read-only)
// Reads src/khmer/levels (TypeScript source, no build needed).
// usage (from KHOEM_AI/localization):
//   node --max-old-space-size=3072 tools/compare-answers.mjs ~/base.mjs ~/downloads/khmer.extra35000.mjs [--out ~/tmp/different.json]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { levelsDir, loadAllEntries, norm, isPairs } from "./lib/khmer-levels.mjs";
const args = process.argv.slice(2);
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const out = val("--out", null);
const mods = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");
const txt = (s) => s.normalize("NFC").replace(/\s+/gu, " ").trim();

const repo = new Map(); // key -> answer (first wins, same as search.ts)
let repoBytes = 0;
for (const [k, a] of loadAllEntries(levelsDir())) { repoBytes += Buffer.byteLength(a); for (const x of k.split("|")) { const n = norm(x); if (n && !repo.has(n)) repo.set(n, a); } }
console.log("repo: keys", repo.size, "| answer bytes", repoBytes);

const diff = [];
for (const f of mods) {
  const m = await import(pathToFileURL(path.resolve(f)));
  let same = 0, differ = 0, absent = 0, bigBytes = 0, seen = new Set(), longer = 0, shorter = 0;
  for (const [name, arr] of Object.entries(m)) {
    if (!isPairs(arr) || /PERSONA/i.test(name)) continue;
    for (const [k, a] of arr) {
      const first = norm(k.split("|")[0]); if (!first || seen.has(first)) continue; seen.add(first);
      bigBytes += Buffer.byteLength(a);
      const r = repo.get(first);
      if (r === undefined) { absent++; continue; }
      if (txt(r) === txt(a)) same++;
      else { differ++; if (a.length > r.length) longer++; else shorter++; diff.push([k, a, r]); }
    }
  }
  console.log(`${path.basename(f)}: distinct ${seen.size} | same answer ${same} | DIFFERENT answer ${differ} (file longer ${longer}, repo longer ${shorter}) | key absent ${absent} | answer bytes ${bigBytes}`);
}
if (out && diff.length) { fs.writeFileSync(path.resolve(out), JSON.stringify(diff.slice(0, 500))); console.log("first", Math.min(500, diff.length), "different entries written to", out, "[key, phoneAnswer, repoAnswer]"); }
