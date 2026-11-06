import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) { console.error("usage: node extract-sentences.mjs <article-dir>"); process.exit(1); }
const seen = new Set();
const out = [];

for (const f of readdirSync(dir)) {
  if (!f.endsWith(".json")) continue;
  let d;
  try { d = JSON.parse(readFileSync(join(dir, f), "utf8")); } catch { continue; }
  if (d.predicted_language !== "khm") continue;
  for (const para of d.sentences ?? []) {
    for (const s of para) {
      const t = s.replace(/[\u200B\u200C\u200D]/g, "").trim();
      if (t.length < 10 || seen.has(t)) continue;
      seen.add(t);
      out.push(JSON.stringify({ text: t, section: d.section, src: d.filename }));
    }
  }
}

writeFileSync(process.argv[3] ?? "sentences.jsonl", out.join("\n") + "\n");
console.log(out.length, "sentences");
