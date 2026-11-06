#!/usr/bin/env node
// review-voa.mjs: human review of VOA (MOT) articles that may contain third-party text (AP, Reuters, AFP ...).
// Run in KHOEM_AI/corpus-sample.
//   node review-voa.mjs --list        count + preview candidate files, change nothing
//   node review-voa.mjs               interactive: x = exclude, k = keep, s = skip for now, q = quit (resumable)
// Options: --only credit|mention  (review only source-line-like hits, or only mid-text mentions)
// Candidates = articles NOT already in exclude-third-party.txt / pending-third-party-review.txt that mention
// a known outlet or credit anywhere in the text. Decisions are saved in review-decisions.json.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
const a = process.argv.slice(2);
const dir = a.includes("--dir") ? a[a.indexOf("--dir") + 1] : "extracted/khm_khmer_voanews/article";
const readList = (f) => fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").map((x) => x.trim()).filter(Boolean) : [];
const idOf = (fn) => (fn.match(/(\d+)\.json$/) || [])[1];
const done = new Set([...readList("exclude-third-party.txt"), ...readList("pending-third-party-review.txt")].map(idOf).filter(Boolean));
const decFile = "review-decisions.json";
const dec = fs.existsSync(decFile) ? JSON.parse(fs.readFileSync(decFile, "utf8")) : {};
const SIGNAL = /\b(AP|AFP|Reuters|Associated Press|Agence France|Bloomberg|CNN|BBC|Getty|Xinhua|Kyodo|dpa|EPA|Photo[: ]|Credit[: ])\b|រ៉យទ័រ|រ៉ូទ័រ|រ៉ូយទ័រ|អាសូស៊ីអេត|អេភីភី|ភ្នាក់ងារព័ត៌មាន(?:បារាំង|អាមេរិក|អង់គ្លេស|ចិន|ជប៉ុន)/u;
const KH = /[ក-៿]/g, LA = /[A-Za-z]/g;
const SIG_G = new RegExp(SIGNAL.source, "gu");
// "credit" = outlet looks like a source line (in brackets, after a dash / ដោយ / ប្រភព, or in a short paragraph); else "mention" (cited in running text)
const classify = (ps) => {
  for (const p of ps) for (const m of p.matchAll(SIG_G)) {
    const before = p.slice(Math.max(0, m.index - 12), m.index), after = p.slice(m.index + m[0].length, m.index + m[0].length + 3);
    if (/[(\[（—–-]\s*$|ដោយ\s*$|ប្រភព[៖:]?\s*$/u.test(before) || /^\s*[)\]）]/.test(after) || p.trim().length < 60) return { cls: "credit" };
  }
  return { cls: "mention" };
};
const only = a.includes("--only") ? a[a.indexOf("--only") + 1] : null;
const cands = [];
for (const fn of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const id = idOf(fn); if (!id || done.has(id) || dec[id]) continue;
  let j; try { j = JSON.parse(fs.readFileSync(path.join(dir, fn), "utf8")); } catch { continue; }
  const ps = Array.isArray(j.paragraphs) ? j.paragraphs : []; const text = ps.join("\n");
  const k = (text.match(KH) || []).length, l = (text.match(LA) || []).length;
  if (!text.trim() || k / ((k + l) || 1) < 0.5) continue;
  const m = text.match(SIGNAL); if (!m) continue;
  const c = classify(ps); if (only && c.cls !== only) continue;
  cands.push({ fn, id, j, ps, text, at: m.index, hit: m[0], cls: c.cls });
}
console.log(`candidates: ${cands.length}   already decided: ${Object.keys(dec).length}   excluded/pending lists: ${done.size}`);
const byCls = {}, byHit = {}; cands.forEach((c) => { byCls[c.cls] = (byCls[c.cls] || 0) + 1; byHit[c.hit] = (byHit[c.hit] || 0) + 1; });
console.log("by class:", JSON.stringify(byCls), "\nby outlet:", JSON.stringify(byHit));
if (a.includes("--list")) { cands.slice(0, 15).forEach((c) => console.log(" ", c.fn.slice(0, 60), "→", c.hit)); process.exit(0); }
if (!cands.length) process.exit(0);
const save = () => fs.writeFileSync(decFile, JSON.stringify(dec, null, 1));
const rl = readline.createInterface({ input: process.stdin });
const lines = rl[Symbol.asyncIterator]();
const ask = async (q) => { process.stdout.write(q); const { value, done } = await lines.next(); if (done) { console.log("(input closed)"); return "q"; } return value; };
let i = 0, nx = 0, nk = 0;
for (const c of cands) {
  i++;
  console.log(`\n=== ${i}/${cands.length} [${c.cls}] ${c.fn}\nsection: ${c.j.section || "?"}   title: ${(c.j.title || c.ps[0] || "").slice(0, 80)}`);
  console.log(`signal "${c.hit}" at: …${c.text.slice(Math.max(0, c.at - 70), c.at + 90).replace(/\n/g, " ⏎ ")}…`);
  console.log(`last paragraph: ${(c.ps[c.ps.length - 1] || "").slice(0, 160)}`);
  let r = ""; while (!/^[xksq]$/.test(r)) r = (await ask("[x]=exclude  [k]=keep  [s]=skip  [q]=quit > ")).trim().toLowerCase();
  if (r === "q") break;
  if (r === "x") { fs.appendFileSync("exclude-third-party.txt", `khm_khmer_voanews/article/${c.fn}\n`); dec[c.id] = "excluded"; nx++; }
  if (r === "k") { dec[c.id] = "kept"; nk++; }
  save();
}
rl.close();
console.log(`\nsession: excluded ${nx}, kept ${nk}. Next: node pipeline.mjs   (recounts eligible words)`);
