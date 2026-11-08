#!/usr/bin/env node
// verify-levels.mjs: prove the levels/ layout holds EXACTLY the same entries as the old data*.ts files in an OLD git commit.
// Read-only. Needs the commit BEFORE the restructure (the one that still has data.ts, data.extra.*.ts ...):
//   node KHOEM_AI/localization/tools/verify-levels.mjs <old-git-ref> [dir]      (run in the git root, e.g. ~/KHOEM_AI)
//   example for the restructure commit bcf5afa:   ... verify-levels.mjs bcf5afa^
// After new entries were added to levels/, the two sides are expected to differ by exactly those new entries.
//   1) same multiset of entries (no entry lost, none added, none duplicated)
//   2) for keys that appear more than once, the answer that wins ("earlier wins") is the same in old and new order
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const ref = process.argv[2];
if (!ref) { console.error("usage: node tools/verify-levels.mjs <old-git-ref> [dir]   (e.g. bcf5afa^)"); process.exit(2); }
const dir = process.argv[3] || "KHOEM_AI/localization/src/khmer";
const OLD_ORDER = ["data.ts", "data.extra.1.ts", "data.extra.2.ts", "data.extra.3.ts", "data.extra.4.ts", "data.extra.5.ts", "data.hand.ts",
  "data.extra2.1.ts", "data.extra2.2.ts", "data.extra3.ts", "data.extra4.ts", "data.extra5.ts", "data.extra6.ts", "data.extra7.ts", "data.extra8.ts"];
const norm = (s) => s.normalize("NFC").trim().toLowerCase().replace(/[?។!！？,，.៖;；:]+$/u, "").replace(/\s+/gu, " ");
const parse = (text) => { const out = []; for (const line of text.split("\n")) {
  const t = line.trim(); if (!t.startsWith('["')) continue;
  try { const e = JSON.parse(t.replace(/,$/, "")); if (Array.isArray(e) && e.length === 2) out.push(e); } catch {} } return out; };
const git = (args) => execFileSync("git", args, { maxBuffer: 1 << 30, encoding: "utf8" });
const tracked = new Set(git(["ls-tree", "--name-only", ref, dir + "/"]).split("\n").map((p) => path.basename(p)));
const oldEntries = [], oldCount = {};
for (const f of OLD_ORDER) if (tracked.has(f)) { const e = parse(git(["show", `${ref}:${dir}/${f}`])); oldCount[f] = e.length; oldEntries.push(...e); }
const newEntries = [];
for (const lv of ["level1", "level2", "level3"]) for (const f of fs.readdirSync(path.join(dir, "levels", lv)).filter((x) => /^part-\d+\.ts$/.test(x)).sort())
  newEntries.push(...parse(fs.readFileSync(path.join(dir, "levels", lv, f), "utf8")));
if (!oldEntries.length) { console.error(`no old data files found in ${ref}:${dir}/`); process.exit(2); }
console.log("old files:", JSON.stringify(oldCount));
console.log(`old entries: ${oldEntries.length}   new entries: ${newEntries.length}`);
const tally = (arr) => { const m = new Map(); for (const e of arr) { const k = JSON.stringify(e); m.set(k, (m.get(k) || 0) + 1); } return m; };
const A = tally(oldEntries), B = tally(newEntries);
let lost = 0, added = 0; const ls = [], as = [];
for (const [k, n] of A) { const d = n - (B.get(k) || 0); if (d > 0) { lost += d; if (ls.length < 3) ls.push(k.slice(0, 120)); } }
for (const [k, n] of B) { const d = n - (A.get(k) || 0); if (d > 0) { added += d; if (as.length < 3) as.push(k.slice(0, 120)); } }
console.log(`entries lost: ${lost}   entries added/duplicated: ${added}`); ls.forEach((x) => console.log("  LOST ", x)); as.forEach((x) => console.log("  EXTRA", x));
const winners = (arr) => { const w = new Map(), dup = new Set(); for (const [keys, ans] of arr) for (const k of keys.split("|")) { const n = norm(k); if (!n) continue; if (w.has(n)) dup.add(n); else w.set(n, ans); } return { w, dup }; };
const o = winners(oldEntries), n = winners(newEntries);
let diff = 0; const ds = [];
for (const [k, ans] of o.w) if (n.w.get(k) !== ans) { diff++; if (ds.length < 3) ds.push(k); }
console.log(`keys: old ${o.w.size}, new ${n.w.size}   repeated keys: old ${o.dup.size}, new ${n.dup.size}   keys whose winning answer differs: ${diff}`);
ds.forEach((k) => console.log("  DIFF ", k));
const ok = lost === 0 && added === 0 && diff === 0 && o.w.size === n.w.size;
console.log(ok ? "RESULT: IDENTICAL (same entries, same winners)" : "RESULT: DIFFERENT, do not commit yet; send this output");
process.exit(ok ? 0 : 1);
