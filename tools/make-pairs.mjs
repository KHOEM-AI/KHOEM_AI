import fs from 'node:fs';
import crypto from 'node:crypto';
const DIR = 'code-corpus', OUT = 'code-corpus/pairs';
fs.mkdirSync(OUT, { recursive: true });
const h32 = s => crypto.createHash('sha256').update(s).digest().readUInt32BE(0);
const splitOf = p => { const k = h32(p) % 100; return k < 80 ? 'train' : k < 90 ? 'valid' : 'test'; };
const strip = l => l.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""').replace(/\/\/.*$/, '');
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
  return out.filter(Boolean).join(' ').slice(0, 300);
}
function jsEnd(lines, i, st = strip) {
  let depth = 0, seen = false;
  for (let j = i; j < Math.min(lines.length, i + 80); j++) {
    const s = st(lines[j]);
    for (const c of s) { if (c === '{') { depth++; seen = true; } else if (c === '}') depth--; }
    if (seen && depth <= 0) return j;
    if (!seen && j === i && /;\s*$/.test(s)) return j;
  }
  return -1;
}
function pyEnd(lines, i) {
  let last = i;
  for (let j = i + 1; j <= i + 81 && j < lines.length; j++) {
    if (lines[j].trim() === '') continue;
    if (/^\s/.test(lines[j])) { last = j; if (j - i > 80) return -1; } else break;
  }
  return last > i ? last : -1;
}
const JS1 = /^(export\s+)?(default\s+)?(async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)\s*\(/;
const JS2 = /^(export\s+)?const\s+([A-Za-z0-9_$]+)\s*(:[^=]+)?=\s*(async\s*)?(\([^)]*\)|[A-Za-z0-9_$]+)\s*(:[^=]+)?=>/;
const PY = /^(async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/;
const BR = /^\s{0,4}(?:[A-Za-z_][\w:<>,*&\[\]]*\s+)+[*&]*([A-Za-z_]\w*)\s*\([^;]*\)\s*(?:const|noexcept|override|final|\s)*\{?\s*$/;
const GO = /^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*[\[(]/;
const RS = /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:(?:async|unsafe|const)\s+)*fn\s+([A-Za-z_]\w*)\s*[<(]/;
const stripRs = l => l.replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/, '');
const KW = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'else', 'sizeof', 'new', 'delete', 'do']);
const BRACE = new Set(['c', 'cpp', 'java', 'csharp']);
const LANGS = new Set(['python', 'javascript', 'typescript', 'go', 'rust', ...BRACE]);
const out = { train: [], valid: [], test: [] };
const seen = new Set(), byLang = {};
let files = 0, funcs = 0;
const INS = fs.readdirSync(DIR).filter(n => n.endsWith('.jsonl')).map(n => `${DIR}/${n}`);
for (const IN of INS) for (const raw of fs.readFileSync(IN, 'utf8').split('\n')) {
  if (!raw.trim()) continue;
  const f = JSON.parse(raw);
  const py = f.lang === 'python';
  if (!LANGS.has(f.lang)) continue;
  files++;
  const lines = f.text.split('\n');
  const sp = splitOf(f.path);
  for (let i = 0; i < lines.length; i++) {
    let name = null;
    if (py) { const m = lines[i].match(PY); if (m) name = m[2]; }
    else if (BRACE.has(f.lang)) {
      const m = lines[i].match(BR);
      if (m && !KW.has(m[1]) && !KW.has(lines[i].trim().split(/\s+/)[0]) && (lines[i].includes('{') || (lines[i + 1] || '').trim() === '{')) name = m[1];
    }
    else if (f.lang === 'go') { const m = lines[i].match(GO); if (m) name = m[1]; }
    else if (f.lang === 'rust') { const m = lines[i].match(RS); if (m) name = m[1]; }
    else { const m = lines[i].match(JS1); if (m) name = m[4]; else { const m2 = lines[i].match(JS2); if (m2) name = m2[2]; } }
    if (!name) continue;
    const end = py ? pyEnd(lines, i) : jsEnd(lines, i, f.lang === 'rust' ? stripRs : strip);
    if (end < 0 || end - i < 2) continue;
    const code = lines.slice(i, end + 1).join('\n');
    const sha = crypto.createHash('sha256').update(code).digest('hex');
    if (seen.has(sha)) continue;
    seen.add(sha);
    const d = leading(lines, i, py);
    const k = h32(f.path + name);
    const ans = '```' + f.lang + '\n' + code + '\n```';
    for (const T of [KM[k % 3], EN[k % 3]])
      out[sp].push(JSON.stringify({ messages: [{ role: 'user', content: T(name, f.lang, d) }, { role: 'assistant', content: ans }], lang: f.lang, path: f.path }));
    funcs++; byLang[f.lang] = (byLang[f.lang] || 0) + 1;
  }
}
for (const s of Object.keys(out)) fs.writeFileSync(`${OUT}/${s}.jsonl`, out[s].join('\n') + '\n');
console.log(`sources=${INS.length} files=${files} functions=${funcs}`, JSON.stringify(byLang));
for (const s of Object.keys(out)) console.log(s, out[s].length, 'examples');
