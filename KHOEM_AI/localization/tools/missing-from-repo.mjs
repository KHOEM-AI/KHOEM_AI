#!/usr/bin/env node
// missing-from-repo.mjs: how much of the big phone files is NOT yet in the repo? (read-only, writes nothing in the repo)
// Reads src/khmer/levels (TypeScript source, no build needed).
// usage (from KHOEM_AI/localization):
//   node --max-old-space-size=3072 tools/missing-from-repo.mjs ~/base.mjs ~/downloads/khmer.extra35000.mjs
// option: --out ~/tmp/missing.json
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { levelsDir, loadAllEntries, norm, isPairs } from "./lib/khmer-levels.mjs";
const args = process.argv.slice(2);
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const out = val("--out", null);
const mods = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");

// 1) every key the repo already answers
const repo = new Set();
for (const [k] of loadAllEntries(levelsDir())) for (const a of k.split("|")) { const n = norm(a); if (n) repo.add(n); }
console.log("keys already in repo:", repo.size);

// 2) compare the big files (PERSONA_CLAIMS arrays are never counted)
const missing = new Map(); // first key -> [keys, answer]
for (const f of mods) {
  const m = await import(pathToFileURL(path.resolve(f)));
  let entries = 0, already = 0, partial = 0, fresh = 0;
  const seenArr = new Set();
  for (const [name, arr] of Object.entries(m)) {
    if (!isPairs(arr) || /PERSONA/i.test(name)) continue;
    for (const e of arr) {
      const ks = e[0].split("|").map(norm).filter(Boolean);
      const id = ks.join("|"); if (seenArr.has(id)) continue; seenArr.add(id); entries++;
      const hit = ks.filter((k) => repo.has(k)).length;
      if (hit === ks.length) already++; else if (hit) partial++;
      else { fresh++; if (!missing.has(ks[0])) missing.set(ks[0], e); }
    }
  }
  console.log(`${path.basename(f)}: distinct entries ${entries} | already in repo ${already} | partly ${partial} | NOT in repo ${fresh}`);
}
console.log("total NOT in repo (distinct keys):", missing.size);
if (out) { fs.writeFileSync(path.resolve(out), JSON.stringify([...missing.values()])); console.log("list written to", out); }
