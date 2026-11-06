import fs from 'node:fs';
import crypto from 'node:crypto';
const DIR = 'code-corpus', OUT = 'code-corpus/pairs';
fs.mkdirSync(OUT, { recursive: true });
const h32 = s => crypto.createHash('sha256').update(s).digest().readUInt32BE(0);
const splitOf = p => { const k = h32(p) % 100; return k < 80 ? 'train' : k < 90 ? 'valid' : 'test'; };
const strip = l => l.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""').replace(/\/\/.*$/, '');

// ---- hybrid split: repo-level when a language has >=5 repos, else path-level ----
const REPO_LANGS = {};
for (const IN of fs.readdirSync(DIR).filter(n => n.endsWith('.jsonl')).map(n => `${DIR}/${n}`)) {
  const rp = IN.split('/').pop().replace('.jsonl', '');
  for (const raw of fs.readFileSync(IN, 'utf8').split('\n')) {
    if (!raw.trim()) continue;
    const m = raw.match(/^\{"lang":"([a-z]+)"/);
    if (m) (REPO_LANGS[m[1]] ||= new Set()).add(rp);
  }
}
const REPO_SPLIT = {};
for (const [L, set] of Object.entries(REPO_LANGS)) {
  const repos = [...set].sort((a, b) => h32(a + L) - h32(b + L));
  REPO_SPLIT[L] = {};
  if (repos.length >= 5) {
    const nv = Math.max(1, Math.round(repos.length * 0.1));
    repos.forEach((r, i) => REPO_SPLIT[L][r] = i < nv ? 'valid' : i < 2 * nv ? 'test' : 'train');
  }
}
function splitFor(repo, lang, p) {
  const m = REPO_SPLIT[lang];
  if (m && m[repo]) return m[repo];
  return splitOf(p);          // few repos: split by file path (repo leak accepted)
}
const KM = [
  (n, l, d) => `សរសេរ function \`${n}\` ជា ${l}` + (d ? ` ដែល៖ ${d}` : ''),
  (n, l, d) => `ជួយសរសេរកូដ ${l} សម្រាប់ \`${n}\`` + (d ? ` (${d})` : ''),
  (n, l, d) => `បង្កើត \`${n}\` ក្នុង ${l}` + (d ? ` ដើម្បី៖ ${d}` : ''),
];
const EN = [
  (n, l, d) => `Write a ${l} function \`${n}\`` + (d ? ` that does the following: ${d}` : ''),
  (n, l, d) => `Implement \`${n}\` in ${l}` + (d ? `. Purpose: ${d}` : ''),
  (n, l, d) => `Create \`${n}\` in ${l}` + (d ? ` - ${d}` : ''),
];
function leading(lines, i, py) {
  const out = [];
  for (let j = i - 1; j >= 0; j--) {
    const t = lines[j].trim();
    if (py ? t.startsWith('#') : /^(\/\/|\/\*|\*)/.test(t))
      out.unshift(t.replace(/^(\/\/+|#+|\/\*+|\*+\/?)\s?/, '').replace(/\*\/$/, '').trim());
    else break;
  }
  const seenC = new Set(); const uniq = out.filter(x => x && !seenC.has(x) && seenC.add(x));
  return uniq.join(' ').replace(/(.{8,}?)\1+/g, '$1').slice(0, 300);
}
function jsEnd(lines, i, st = strip) {
  let depth = 0, seen = false;
  for (let j = i; j < Math.min(lines.length, i + 80); j++) {
    const s = st(lines[j]);
    if (!seen && j > i && (s.trim() === '' || DECL.test(s))) return -1;
    if (!seen && j > i && /^\s*(\/\*|\*)/.test(s)) return -1;
    for (const c of s) { if (c === '{') { depth++; seen = true; } else if (c === '}') depth--; }
    if (seen && depth <= 0) return j;
    if (!seen && j === i && /;\s*$/.test(s)) return j;
  }
  return -1;
}
function pyEnd(lines, i) {
  let depth = 0, tq = null, sigDone = false, sigEnd = i, last = i;
  for (let j = i; j <= i + 81 && j < lines.length; j++) {
    const s = lines[j];
    const inStr = tq !== null;
    if (!inStr && s.trim() === '') continue;
    if (j > i && sigDone && !inStr && depth === 0 && !/^\s/.test(s)) break;
    if (j - i > 80) return -1;
    let code = '';
    for (let p = 0; p < s.length; p++) {
      const c = s[p];
      if (tq) {
        if (c === '\\') { p++; continue; }
        if (s.startsWith(tq, p)) { p += 2; tq = null; }
        continue;
      }
      if (c === '#') break;
      if (c === '"' || c === "'") {
        const t = c + c + c;
        if (s.startsWith(t, p)) { tq = t; p += 2; continue; }
        for (p++; p < s.length && s[p] !== c; p++) if (s[p] === '\\') p++;
        continue;
      }
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      code += c;
    }
    last = j;
    if (!sigDone && depth === 0 && !tq && /:\s*$/.test(code)) { sigDone = true; sigEnd = j; }
  }
  return sigDone && depth === 0 && !tq && last > sigEnd ? last : -1;
}
const JS1 = /^\s{0,4}(export\s+)?(default\s+)?(async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)\s*\(/;
const JS2 = /^\s{0,4}(export\s+)?const\s+([A-Za-z0-9_$]+)\s*(:[^=]+)?=\s*(async\s*)?(\([^)]*\)|[A-Za-z0-9_$]+)\s*(:[^=]+)?=>/;
const JSM = /^\s{2,6}(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\([^)'"`]*\)\s*(?::\s*[^={;]+)?\{\s*$/;
const PHP = /^\s{0,8}(?:(?:public|private|protected|static|final|abstract)\s+)*function\s+&?([A-Za-z_]\w*)\s*\(/;
const KT = /^\s{0,8}(?:(?:public|private|protected|internal|override|suspend|inline|open|abstract)\s+)*fun\s+(?:<[^>]*>\s*)?(?:[\w.<>?]+\.)?([A-Za-z_]\w*)\s*\(/;
const SW = /^\s{0,8}(?:(?:public|private|fileprivate|internal|open|static|final|override|mutating|@\w+)\s+)*func\s+([A-Za-z_]\w*)\s*[<(]/;
const PY = /^(async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/;
const BR = /^\s{0,4}(?:[A-Za-z_][\w:<>,*&\[\]]*\s+)+[*&]*([A-Za-z_]\w*)\s*\([^;]*\)\s*(?:const|noexcept|override|final|\s)*\{?\s*$/;
const GO = /^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*[\[(]/;
const RS = /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:(?:async|unsafe|const)\s+)*fn\s+([A-Za-z_]\w*)\s*[<(]/;
const stripRs = l => l.replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/, '');
const KW = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'else', 'sizeof', 'new', 'delete', 'do', 'describe', 'it', 'test', 'suite', 'beforeEach', 'afterEach', 'before', 'after', 'expect', 'group', 'setUp', 'tearDown']);
const TEST_RE_STRICT = /(^|\/)(tests?|__tests__|spec|specs|Tests|testing)\/|\.(test|spec)\.[jt]sx?$|(Tests?|_test)\.(php|kt|swift|dart|go|java|rs|py)$|(^|\/)test_[^/]*\.py$/;
const DECL = /^\s*(?:@\w+\s+)*(?:(?:public|private|protected|internal|override|open|abstract|static|final|suspend|inline)\s+)*(?:fun|func|function|class|object|interface|companion|val|var|let|struct|enum|impl|trait)\b/;
const TEST_RE = TEST_RE_STRICT;
const KEEP_TESTDIR = new Set(['python', 'java']);
const TESTNAME = /^test/i;
const BRACE = new Set(['c', 'cpp', 'java', 'csharp']);
const LANGS = new Set(['python', 'javascript', 'typescript', 'go', 'rust', 'php', 'kotlin', 'swift', 'dart', ...BRACE]);
const out = { train: [], valid: [], test: [] };
const seen = new Set(), byLang = {};
let files = 0, funcs = 0;
const INS = fs.readdirSync(DIR).filter(n => n.endsWith('.jsonl')).map(n => `${DIR}/${n}`);
for (const IN of INS) for (const raw of fs.readFileSync(IN, 'utf8').split('\n')) {
  if (!raw.trim()) continue;
  const f = JSON.parse(raw);
  const py = f.lang === 'python';
  if (!LANGS.has(f.lang)) continue;
  if (TEST_RE.test(f.path) && !(KEEP_TESTDIR.has(f.lang) && !/(^|\/)test_[^/]*\.py$|Tests?\.java$/.test(f.path))) continue;
  const repo = IN.split('/').pop().replace('.jsonl', '');
  files++;
  const lines = f.text.split('\n');
  const sp = splitFor(repo, f.lang, f.path);
  for (let i = 0; i < lines.length; i++) {
    let name = null;
    if (py) { const m = lines[i].match(PY); if (m) name = m[2]; }
    else if (BRACE.has(f.lang)) {
      const m = lines[i].match(BR);
      if (m && !KW.has(m[1]) && !KW.has(lines[i].trim().split(/\s+/)[0]) && (lines[i].includes('{') || (lines[i + 1] || '').trim() === '{')) name = m[1];
    }
    else if (f.lang === 'php') { const m = lines[i].match(PHP); if (m) name = m[1]; }
    else if (f.lang === 'kotlin') { const m = lines[i].match(KT); if (m) name = m[1]; }
    else if (f.lang === 'swift') { const m = lines[i].match(SW); if (m) name = m[1]; }
    else if (f.lang === 'dart') { const m = lines[i].match(BR); if (m && !KW.has(m[1]) && !KW.has(lines[i].trim().split(/\s+/)[0]) && lines[i].includes('{')) name = m[1]; }
    else if (f.lang === 'go') { const m = lines[i].match(GO); if (m) name = m[1]; }
    else if (f.lang === 'rust') { const m = lines[i].match(RS); if (m) name = m[1]; }
    else {
      const m = lines[i].match(JS1);
      if (m) name = m[4];
      else {
        const m2 = lines[i].match(JS2);
        if (m2) name = m2[2];
        else {
          const m3 = lines[i].match(JSM);
          if (m3 && !KW.has(m3[1]) && m3[1] !== 'constructor') name = m3[1];
        }
      }
    }
    if (!name) continue;
    if (KEEP_TESTDIR.has(f.lang) && TESTNAME.test(name)) continue;
    const end = py ? pyEnd(lines, i) : jsEnd(lines, i, f.lang === 'rust' ? stripRs : strip);
    if (end < 0 || end - i < 2) continue;
    const ind = lines[i].match(/^\s*/)[0].length;
    const code = lines.slice(i, end + 1).map(l => l.replace(new RegExp('^\\s{0,' + ind + '}'), '')).join('\n').replace(/,\s*$/, '');
    const sha = crypto.createHash('sha256').update(code).digest('hex');
    if (seen.has(sha)) continue;
    seen.add(sha);
    const d = leading(lines, i, py);
    const k = h32(f.path + name);
    const ans = '```' + f.lang + '\n' + code + '\n```';
    for (const T of [KM[k % 3], EN[k % 3]])
      out[sp].push(JSON.stringify({ messages: [{ role: 'user', content: T(name, f.lang, d) }, { role: 'assistant', content: ans }], lang: f.lang, path: f.path, repo }));
    funcs++; byLang[f.lang] = (byLang[f.lang] || 0) + 1;
  }
}
const CAP = { train: 3000, valid: 400, test: 400 };
for (const s of Object.keys(out)) {
  const byL = {};
  for (let i = 0; i < out[s].length; i += 2) {           // keep KM+EN pairs together
    const L = JSON.parse(out[s][i]).lang;
    (byL[L] ||= []).push([out[s][i], out[s][i + 1]]);
  }
  const kept = [];
  for (const L of Object.keys(byL)) {
    const a = byL[L].sort((x, y) => h32(x[0]) - h32(y[0])).slice(0, CAP[s]);
    for (const [k, e] of a) kept.push(k, e);
  }
  out[s] = kept;
}
for (const s of Object.keys(out)) fs.writeFileSync(`${OUT}/${s}.jsonl`, out[s].join('\n') + '\n');
console.log(`sources=${INS.length} files=${files} functions=${funcs}`, JSON.stringify(byLang));
for (const s of Object.keys(out)) console.log(s, out[s].length, 'examples');
