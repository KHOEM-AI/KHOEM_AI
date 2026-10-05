#!/usr/bin/env node
// KHOEM_AI code corpus builder.
// Kept SEPARATE from the Khmer pipeline (pipeline.mjs) so code never counts
// toward the 75M Khmer-word target.
//
// Usage:
//   node tools/code-corpus.mjs --root . --license project-owned --label khoem-own
//   node tools/code-corpus.mjs --root ../some-repo --license auto --label some-repo
//
// --license project-owned : your own code (no license check)
// --license auto          : read LICENSE/COPYING in root; only permissive accepted
// --license MIT|Apache-2.0|BSD-3-Clause|... : declare it yourself (must be permissive)
//
// Output (in --out, default ./code-corpus, gitignore *.jsonl):
//   <label>.jsonl         one JSON per file: {lang,path,sha256,bytes,lines,tokens,text}
//   <label>.report.json   provenance + per-language stats

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const ROOT = path.resolve(arg("root", "."));
const OUT = path.resolve(arg("out", "code-corpus"));
const LABEL = arg("label", path.basename(ROOT));
const LICENSE_ARG = arg("license", "");
const MAX_BYTES = 1024 * 1024; // skip files > 1 MB

const PERMISSIVE = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Unlicense", "CC0-1.0", "0BSD"];

const EXT = {
  ".ts": "typescript", ".tsx": "typescript",
  ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript", ".jsx": "javascript",
  ".py": "python", ".css": "css", ".html": "html", ".htm": "html",
  ".c": "c", ".h": "c", ".cpp": "cpp", ".cc": "cpp", ".hpp": "cpp",
  ".cs": "csharp", ".java": "java", ".sql": "sql", ".sh": "shell", ".bash": "shell",
};

const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "out", "coverage", ".next", ".cache",
  "__pycache__", "venv", ".venv", "vendor", "target", "bin", "obj",
  "raw", "extracted", "evidence", "code-corpus",
]);

const SECRET_RES = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{30,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /(api[_-]?key|secret|token|passwd|password)\s*[:=]\s*['"][A-Za-z0-9_\-+/=]{16,}['"]/i,
];

function detectLicense(root) {
  for (const n of ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING", "UNLICENSE"]) {
    const p = path.join(root, n);
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, "utf8").slice(0, 6000);
    if (/Apache License/i.test(t) && /Version 2\.0/i.test(t)) return "Apache-2.0";
    if (/GNU (GENERAL|LESSER|AFFERO)/i.test(t)) return "GPL-family";
    if (/Mozilla Public License/i.test(t)) return "MPL";
    if (/This is free and unencumbered software/i.test(t)) return "Unlicense";
    if (/Permission is hereby granted, free of charge/i.test(t)) return "MIT";
    if (/Redistribution and use in source and binary forms/i.test(t)) {
      return /Neither the name/i.test(t) ? "BSD-3-Clause" : "BSD-2-Clause";
    }
    if (/Permission to use, copy, modify, and\/or distribute/i.test(t)) return "ISC";
    return "UNKNOWN";
  }
  return "NONE";
}

// ---- license gate ----
let license;
if (LICENSE_ARG === "project-owned") license = "project-owned";
else if (LICENSE_ARG === "auto" || LICENSE_ARG === "") license = detectLicense(ROOT);
else license = LICENSE_ARG;

if (license !== "project-owned" && !PERMISSIVE.includes(license)) {
  console.error(`STOP: license "${license}" is not accepted for ${ROOT}.`);
  console.error(`Accepted: project-owned, ${PERMISSIVE.join(", ")}`);
  console.error(`Use --license project-owned only for code you wrote yourself.`);
  process.exit(2);
}

// ---- walk ----
function* walk(dir) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.name.startsWith(".") && e.isDirectory() && e.name !== ".github") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(p);
    } else if (e.isFile()) yield p;
  }
}

const tokRe = /[A-Za-z_][A-Za-z0-9_]*|\d+|[^\sA-Za-z0-9_]/g;
fs.mkdirSync(OUT, { recursive: true });
const outPath = path.join(OUT, `${LABEL}.jsonl`);
const ws = fs.createWriteStream(outPath);

const seen = new Set();
const stats = {};
const skipped = { ext: 0, bak_or_min: 0, too_big: 0, binary: 0, generated: 0, long_lines: 0, secret: 0, duplicate: 0, empty: 0 };
const bump = (lang, k, n) => { (stats[lang] ??= { files: 0, lines: 0, bytes: 0, tokens: 0 })[k] += n; };

for (const file of walk(ROOT)) {
  const base = path.basename(file);
  const ext = path.extname(base).toLowerCase();
  const lang = EXT[ext];
  if (!lang) { skipped.ext++; continue; }
  if (/\.bak/i.test(base) || /\.min\.(js|css)$/i.test(base)) { skipped.bak_or_min++; continue; }
  let buf;
  try { buf = fs.readFileSync(file); } catch { continue; }
  if (buf.length === 0) { skipped.empty++; continue; }
  if (buf.length > MAX_BYTES) { skipped.too_big++; continue; }
  if (buf.includes(0)) { skipped.binary++; continue; }
  const text = buf.toString("utf8").replace(/\r\n/g, "\n");
  const head = text.slice(0, 500);
  if (/@generated|DO NOT EDIT|auto-generated|autogenerated/i.test(head)) { skipped.generated++; continue; }
  const lines = text.split("\n");
  if (text.length / lines.length > 500) { skipped.long_lines++; continue; }
  if (SECRET_RES.some((r) => r.test(text))) { skipped.secret++; console.error("secret-like content, skipped:", path.relative(ROOT, file)); continue; }
  const sha = crypto.createHash("sha256").update(text).digest("hex");
  if (seen.has(sha)) { skipped.duplicate++; continue; }
  seen.add(sha);
  const tokens = (text.match(tokRe) || []).length;
  ws.write(JSON.stringify({ lang, path: path.relative(ROOT, file), sha256: sha, bytes: buf.length, lines: lines.length, tokens, text }) + "\n");
  bump(lang, "files", 1); bump(lang, "lines", lines.length); bump(lang, "bytes", buf.length); bump(lang, "tokens", tokens);
}
await new Promise((r) => ws.end(r));

let commit = null;
try { commit = execSync("git rev-parse HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}

const total = Object.values(stats).reduce((a, s) => ({ files: a.files + s.files, lines: a.lines + s.lines, bytes: a.bytes + s.bytes, tokens: a.tokens + s.tokens }), { files: 0, lines: 0, bytes: 0, tokens: 0 });
const report = {
  label: LABEL, kind: "code", root: ROOT, license,
  rights: license === "project-owned" ? "owner's own code" : "permissive license, attribution/notice may be required",
  git_commit: commit, created_at: new Date().toISOString(),
  counts_toward_khmer_target: false,
  tokenizer: "regex:identifier|number|symbol (approximate, not a model tokenizer)",
  total, by_language: stats, skipped,
};
fs.writeFileSync(path.join(OUT, `${LABEL}.report.json`), JSON.stringify(report, null, 2));

console.log(`license=${license}  files=${total.files}  lines=${total.lines}  tokens~${total.tokens}`);
for (const [l, s] of Object.entries(stats).sort((a, b) => b[1].tokens - a[1].tokens))
  console.log(`  ${l.padEnd(11)} files=${String(s.files).padStart(4)} lines=${String(s.lines).padStart(7)} tokens~${s.tokens}`);
console.log("skipped:", JSON.stringify(skipped));
console.log("wrote:", outPath);
