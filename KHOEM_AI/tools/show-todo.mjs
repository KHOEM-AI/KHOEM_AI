import fs from 'node:fs';
const rd = f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const done = new Set(rd('code-corpus/explain/gold.jsonl').map(r => r.id));
const todo = rd('code-corpus/explain/gold.todo.jsonl')
  .filter(r => !done.has(r.id) && r.code.split('\n').length <= 25)
  .slice(0, 5);
for (const r of todo) console.log('### ' + r.id + ' [' + r.lang + ']\n' + r.code + '\n');
