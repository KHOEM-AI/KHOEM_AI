import fs from 'node:fs';
import crypto from 'node:crypto';
const OUT = 'code-corpus/explain';
const CAP = { train: 250, valid: 30, test: 30 };   // ក្នុងមួយភាសា
const KHMER = /[\u1780-\u17FF]/;
const h = s => crypto.createHash('sha256').update(s).digest().readUInt32BE(0);
const hintOf = p => {
  const m = p.match(/does the following: (.*)$|Purpose: (.*)$| - (.*)$/s);
  return (m && (m[1] || m[2] || m[3]) || '').trim();
};
for (const sp of ['train', 'valid', 'test']) {
  const byL = {}, seen = new Set();
  for (const l of fs.readFileSync(`code-corpus/pairs/${sp}.jsonl`, 'utf8').split('\n').filter(Boolean)) {
    const r = JSON.parse(l);
    const prompt = r.messages[0].content;
    if (KHMER.test(prompt)) continue;               // យកតែ row អង់គ្លេស (មិនស្ទួន)
    const code = r.messages[1].content.replace(/^```\w*\n/, '').replace(/\n```$/, '');
    const n = code.split('\n').length;
    if (n < 6 || n > 40 || code.length > 1800) continue;
    if (/^\s*(test|it|describe)/i.test(code)) continue;
    const sha = crypto.createHash('sha256').update(code).digest('hex');
    if (seen.has(sha)) continue; seen.add(sha);
    (byL[r.lang] ||= []).push({ id: sha.slice(0, 12), lang: r.lang, repo: r.repo, path: r.path, hint: hintOf(prompt), code });
  }
  const rows = [];
  for (const [L, a] of Object.entries(byL))
    rows.push(...a.sort((x, y) => h(x.id) - h(y.id)).slice(0, CAP[sp]));
  fs.writeFileSync(`${OUT}/tasks.${sp}.jsonl`, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  console.log(sp, rows.length, Object.fromEntries(Object.entries(byL).map(([k, v]) => [k, Math.min(v.length, CAP[sp])])));
}
