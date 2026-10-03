import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const d = m.datasets.find(x => x.dataset_id === "mot-km-voa-001");
const ev = d.license_evidence || {};
const why = [];
if (d.rights_review_status !== "approved") why.push("rights_review_status=" + d.rights_review_status);
if (!(d.approved_purposes || []).includes("internal analysis")) why.push("internal analysis not approved");
if (d.privacy_review_status !== "passed") why.push("privacy_review_status=" + d.privacy_review_status);
if (d.quality_status !== "passed") why.push("quality_status=" + d.quality_status);
if (d.processing_status !== "ready") why.push("processing_status=" + d.processing_status);
if (ev.decision !== "approved" || !/^[0-9a-f]{64}$/i.test(ev.evidence_sha256 || "")) why.push("license_evidence incomplete");
if (why.length) { console.log("BLOCKED:", why); process.exit(1); }

const dir = "extracted/khm_khmer_voanews/article";
const excluded = new Set(fs.readFileSync("exclude-third-party.txt", "utf8").split("\n").map(s => path.basename(s.trim())).filter(Boolean));
const seg = new Intl.Segmenter("km", { granularity: "word" });
const KH = /[\u1780-\u17FF]/;
const seenDoc = new Set(), seenSent = new Set(), vocab = new Set();
const bySection = new Map();
const st = { articlesRead: 0, excluded: 0, emptyOrUnreadable: 0, duplicateDocs: 0, sentences: 0, duplicateSentences: 0, khmerWords: 0, otherWords: 0 };
const h = s => crypto.createHash("sha1").update(s).digest("base64url").slice(0, 16);
for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".json"))) {
  if (excluded.has(f)) { st.excluded++; continue; }
  let j; try { j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { st.emptyOrUnreadable++; continue; }
  const text = (Array.isArray(j.paragraphs) ? j.paragraphs : []).join("\n").normalize("NFC").replace(/[\u200B\uFEFF]/g, "");
  if (!text.trim()) { st.emptyOrUnreadable++; continue; }
  const dh = h(text);
  if (seenDoc.has(dh)) { st.duplicateDocs++; continue; }
  seenDoc.add(dh); st.articlesRead++;
  const sec = j.section || "unknown";
  const rec = bySection.get(sec) || { articles: 0, khmerWords: 0 }; rec.articles++;
  for (const x of text.split(/[។\n]+/).map(s => s.trim()).filter(Boolean)) {
    st.sentences++;
    const sh = h(x);
    if (seenSent.has(sh)) { st.duplicateSentences++; continue; }
    seenSent.add(sh);
    for (const t of seg.segment(x)) if (t.isWordLike) {
      if (KH.test(t.segment)) { st.khmerWords++; rec.khmerWords++; vocab.add(t.segment); } else st.otherWords++;
    }
  }
  bySection.set(sec, rec);
}
const counts = (d.approved_purposes || []).includes("training") && d.data_type !== "synthetic";
const out = { dataset_id: d.dataset_id, tool: "process-articles.mjs", tokenizer_id: "Intl.Segmenter:km:word", ...st,
  uniqueKhmerWords: vocab.size, approved_purposes: d.approved_purposes, counts_toward_target: counts,
  target: m.target_words_total, eligibleWords: counts ? st.khmerWords : 0,
  informational_percent_of_target_if_training_were_approved: +(st.khmerWords / m.target_words_total * 100).toFixed(3),
  topSections: [...bySection].sort((a, b) => b[1].khmerWords - a[1].khmerWords).slice(0, 10).map(([k, v]) => ({ section: k, ...v })) };
fs.writeFileSync("stats-mot-km-voa-001.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
