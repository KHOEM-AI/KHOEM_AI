import fs from 'node:fs';

const c = {};

for (const n of fs.readdirSync('code-corpus').filter(x => x.endsWith('.jsonl'))) {
  for (const l of fs.readFileSync('code-corpus/' + n, 'utf8').split('\n')) {
    if (!l) continue;
    const f = JSON.parse(l);
    c[f.lang] = (c[f.lang] || 0) + 1;
  }
}

console.log(c);
