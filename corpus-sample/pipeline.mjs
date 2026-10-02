import fs from "node:fs";
import crypto from "node:crypto";
const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const seg = new Intl.Segmenter("km", { granularity: "word" });
const seen = new Set(), vocab = new Set();
const rep = { pipeline_version: "0.1", sources: [], blocked: [], eligibleWords: 0 };
let total = 0;
for (const d of m.datasets) {
  const why = [];
  if (d.rights_review_status !== "approved") why.push("rights_review_status=" + d.rights_review_status);
  if (!d.license_url) why.push("license_url missing");
  if (!d.license || d.license === "UNKNOWN") why.push("license unknown");
  if (why.length) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: why }); continue; }
  const text = fs.readFileSync("raw/" + d.file, "utf8").normalize("NFC").replace(/[\u200B\uFEFF]/g, "");
  const sha = crypto.createHash("sha256").update(text).digest("hex");
  const sents = text.split(/[។\n]+/).map(x => x.trim()).filter(Boolean);
  let kept = 0, dup = 0, words = 0;
  for (const x of sents) {
    const h = crypto.createHash("sha256").update(x).digest("hex");
    if (seen.has(h)) { dup++; continue; }
    seen.add(h); kept++;
    for (const t of seg.segment(x)) if (t.isWordLike) { words++; vocab.add(t.segment); }
  }
  total += words;
  const counts = d.data_type !== "synthetic" && (d.approved_purposes || []).includes("training");
  if (counts) rep.eligibleWords += words;
  rep.sources.push({ dataset_id: d.dataset_id, content_sha256: sha, sentences: sents.length, kept, duplicates: dup, words, counts_toward_target: counts });
}
rep.totalWordsProcessed = total;
rep.uniqueWords = vocab.size;
rep.target = m.target_words_total;
rep.progressPercent = +(rep.eligibleWords / m.target_words_total * 100).toFixed(6);
fs.writeFileSync("report.json", JSON.stringify(rep, null, 2));
console.log(JSON.stringify(rep, null, 2));
