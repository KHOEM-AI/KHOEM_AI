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
const byId = new Map(m.datasets.map(x => [x.dataset_id, x]));
for (const d of m.datasets) {
  const why = [];
  if (d.rights_review_status !== "approved") why.push("rights_review_status=" + d.rights_review_status);
  if (!d.license_url) why.push("license_url missing");
  if (d.privacy_review_status !== "passed") why.push("privacy_review_status=" + d.privacy_review_status);
  if (d.quality_status !== "passed") why.push("quality_status=" + d.quality_status);
  if (d.processing_status !== "ready") why.push("processing_status=" + d.processing_status);
  if (!d.license || d.license === "UNKNOWN") why.push("license unknown");
  if (d.data_type !== "synthetic") {
    const ev = d.license_evidence;
    const okStr = v => typeof v === "string" && v.trim() !== "";
    if (!ev || typeof ev !== "object") why.push("license_evidence missing");
    else {
      for (const k of ["terms_url", "reviewer", "decision"]) if (!okStr(ev[k])) why.push("license_evidence." + k + " missing");
      if (okStr(ev.decision) && ev.decision !== "approved") why.push("license_evidence.decision=" + ev.decision);
      if (!okStr(ev.access_date) || !/^\d{4}-\d{2}-\d{2}$/.test(ev.access_date)) why.push("license_evidence.access_date missing_or_invalid");
      const hasSha = typeof ev.evidence_sha256 === "string" && /^[0-9a-f]{64}$/i.test(ev.evidence_sha256);
      if (!hasSha && !okStr(ev.archive_ref)) why.push("license_evidence.checksum_or_archive_ref missing");
    }
  }
  // Lineage: a child may not be approved for more purposes than its parent.
  for (const pid of d.parent_dataset_ids || []) {
    const par = byId.get(pid);
    if (!par) { why.push("parent_missing:" + pid); continue; }
    for (const x of d.approved_purposes || []) {
      if (!(par.approved_purposes || []).includes(x)) why.push("purpose_exceeds_parent:" + x + ":" + pid);
    }
  }
  if (why.length) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: why }); continue; }

  // Derived wordlists are lineage/redistribution artifacts, not corpus inputs.
  if (d.data_type === "derived_wordlist") {
    rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["derived_wordlist_not_corpus"] });
    continue;
  }

  const f = (d.files || [])[0];
  if (!f || !f.path) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["files_missing"] }); continue; }
  const isArchive = /\.(tgz|tar|gz|zip)$/i.test(f.path);
  const exDir = path.join(DIR, "extracted", path.basename(f.path).replace(/\.(tgz|tar|gz|zip)$/i, ""));
  if (isArchive && !fs.existsSync(path.join(exDir, "article"))) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["archive_not_extracted"] }); continue; }
  const rawBuf = fs.readFileSync(path.join(DIR, f.path));
  if ((f.content_sha256 || d.sha256) && crypto.createHash("sha256").update(rawBuf).digest("hex") !== (f.content_sha256 || d.sha256)) { rep.blocked.push({ dataset_id: d.dataset_id, reasons: ["checksum_mismatch"] }); continue; }
  let text;
  if (isArchive) {
    const excl = new Set(fs.readFileSync(path.join(DIR, "exclude-third-party.txt"), "utf8").split("\n").map(x => x.trim()).filter(Boolean));
    const base = path.basename(exDir);
    const exclIds = new Set([...excl].map(x => (x.match(/_(\d+)\.json$/) || [])[1]).filter(Boolean));
    const parts = [];
    let used = 0, excluded = 0, noText = 0, nonKhmer = 0;
    for (const fn of fs.readdirSync(path.join(exDir, "article")).sort()) {
      if (!fn.endsWith(".json")) continue;
      if (exclIds.has((fn.match(/(\d+)\.json$/) || [])[1])) { excluded++; continue; }
      let j;
      try { j = JSON.parse(fs.readFileSync(path.join(exDir, "article", fn), "utf8")); } catch { noText++; continue; }
      let t = j.paragraphs;
      if (Array.isArray(t)) t = t.join("\n");
      if (typeof t !== "string" || !t.trim()) { noText++; continue; }
      const kmN = (t.match(/[\u1780-\u17FF]/g) || []).length, laN = (t.match(/[A-Za-z]/g) || []).length;
      if (kmN / ((kmN + laN) || 1) < 0.5) { nonKhmer++; continue; }
      parts.push(t); used++;
    }
    console.error("[" + d.dataset_id + "] articles used=" + used + " excluded=" + excluded + " no_text=" + noText + " non_khmer=" + nonKhmer);
    text = parts.join("\n").normalize("NFC").replace(/[\u200B\uFEFF]/g, "");
  } else {
    text = rawBuf.toString("utf8").normalize("NFC").replace(/[\u200B\uFEFF]/g, "");
  }
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
