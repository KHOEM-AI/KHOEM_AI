import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const m = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
if (m.schema_version !== 1) throw new Error("unsupported schema_version: " + m.schema_version);
const seg = new Intl.Segmenter("km", { granularity: "word" });
const seenDocs = new Set(), seenSentences = new Set(), vocab = new Set();
const rep = { pipeline_version: "0.2", sources: [], blocked: [], eligibleWords: 0 };
let total = 0;
for (const d of m.datasets) {
  const why = [];
  if (d.rights_review_status !== "approved") why.push("rights_review_status=" + d.rights_review_status);
  if (!d.license_url) why.push("license_url missing");
  if (d.privacy_review_status !== "passed") why.push("privacy_review_status=" + d.privacy_review_status);
  if (d.quality_status !== "passed") why.push("quality_status=" + d.quality_status);
  if (d.processing_status !== "ready") why.push("processing_status=" + d.processing_status);
  if (!d.license || d.license === "UNKNOWN") why.push("license unknown");
  if (d.data_type !== "synthetic" && !d.license_evidence) why.push("license_evidence missing");
  if (why.length) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: why }); continue; }
  const f = (d.files || [])[0];
  if (!f || !f.path) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["files_missing"] }); continue; }
  if (/\.(tgz|tar|gz|zip)$/i.test(f.path)) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["archive_not_extracted"] }); continue; }
  const rawBuf = fs.readFileSync(path.join(DIR, f.path));
  if ((f.content_sha256 || d.sha256) && crypto.createHash("sha256").update(rawBuf).digest("hex") !== (f.content_sha256 || d.sha256)) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["checksum_mismatch"] }); continue; }
  const text = rawBuf.toString("utf8").normalize("NFC").replace(/[\u200B\uFEFF]/g, "");
  const normalizedSha = crypto.createHash("sha256").update(text).digest("hex");
  const documentDuplicate = seenDocs.has(normalizedSha);
  if (documentDuplicate) {
    rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["duplicate_exact"] });
    continue;
  }
  seenDocs.add(normalizedSha);
  const sents = text.split(/[។\n]+/).map(x => x.trim()).filter(Boolean);
  let kept = 0, dup = 0, words = 0;
  for (const x of sents) {
    const h = crypto.createHash("sha256").update(x).digest("hex");
    if (seenSentences.has(h)) { dup++; continue; }
    seenSentences.add(h); kept++;
    for (const t of seg.segment(x)) if (t.isWordLike) { words++; vocab.add(t.segment); }
  }
  total += words;
  const counts = d.data_type !== "synthetic" && (d.approved_purposes || []).includes("training");
  if (counts) rep.eligibleWords += words;
  rep.sources.push({ dataset_id: d.dataset_id, tokenizer_id: d.tokenizer_id, duplicate_exact: documentDuplicate,
    sentence_duplicates: dup,
    normalized_content_sha256: normalizedSha, sentences: sents.length, kept, words, counts_toward_target: counts });
}
rep.totalWordsProcessed = total;
rep.uniqueWords = vocab.size;
rep.target = m.target_words_total;
rep.progressPercent = +(rep.eligibleWords / m.target_words_total * 100).toFixed(6);
fs.writeFileSync(path.join(DIR, "report.json"), JSON.stringify(rep, null, 2));
console.log(JSON.stringify(rep, null, 2));
