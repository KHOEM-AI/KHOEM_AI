#!/usr/bin/env node
// prune-shadowed.mjs: in a Round file (default data.extra3.ts) drop keys that an EARLIER file already answers.
// An entry with no key left is removed. Run in KHOEM_AI/localization after `npm run build`.
//   node tools/prune-shadowed.mjs            (dry-run)   node tools/prune-shadowed.mjs --write
// Optional: --file src/khmer/data.extra3.ts --before data.js,data.extra.js,data.extra2.js
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const a = process.argv.slice(2), val = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const file = val("--file", "src/khmer/data.extra3.ts");
const before = val("--before", "data.js,data.extra.js,data.extra2.js").split(",");
const norm = (s) => s.normalize("NFC").trim().toLowerCase().replace(/[?។!！？,，.៖;；:]+$/u, "").replace(/\s+/gu, " ");
const seen = new Set();
for (const f of before) {
  const m = await import(pathToFileURL(path.resolve("dist/src/khmer", f)));
  const arr = Object.values(m).find((v) => Array.isArray(v) && Array.isArray(v[0]));
  for (const [k] of arr) for (const x of k.split("|")) seen.add(norm(x));
}
const lines = fs.readFileSync(file, "utf8").split("\n"), out = [];
let removed = 0, trimmed = 0, kept = 0;
for (const line of lines) {
  const m = line.match(/^\s*(\[.*\]),\s*$/);
  let pair; try { pair = m && JSON.parse(m[1]); } catch {}
  if (!pair || typeof pair[0] !== "string") { out.push(line); continue; }
  const ks = pair[0].split("|"), live = ks.filter((k) => !seen.has(norm(k)));
  if (!live.length) { removed++; continue; }
  if (live.length < ks.length) { trimmed++; out.push(`  [${JSON.stringify(live.join("|"))}, ${JSON.stringify(pair[1])}],`); } else { kept++; out.push(line); }
}
console.log(`${file}: kept ${kept}, trimmed ${trimmed}, removed (fully shadowed) ${removed}`);
if (a.includes("--write")) { fs.writeFileSync(file, out.join("\n")); console.log("written. Now: npm run verify"); } else console.log("dry-run only. Add --write to apply.");
