import fs from 'node:fs';
const IN = 'code-corpus/pairs', OUT = 'code-corpus/pairs-small';
const CAP = { train: 2000, valid: 150 };
fs.mkdirSync(OUT, { recursive: true });
for (const [s, cap] of Object.entries(CAP)) {
  const by = {};
  for (const l of fs.readFileSync(`${IN}/${s}.jsonl`, 'utf8').split('\n')) {
    if (!l) continue;
    (by[JSON.parse(l).lang] ||= []).push(l);
  }
  const langs = Object.keys(by);
  const per = Math.floor(cap / langs.length);
  const pick = [];
  for (const g of langs) pick.push(...by[g].slice(0, per));
  fs.writeFileSync(`${OUT}/${s}.jsonl`, pick.join('\n') + '\n');
  console.log(s, pick.length, JSON.stringify(Object.fromEntries(langs.map(g => [g, Math.min(per, by[g].length)]))));
}
