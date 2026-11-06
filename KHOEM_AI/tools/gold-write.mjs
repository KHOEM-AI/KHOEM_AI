import fs from 'node:fs';
import readline from 'node:readline/promises';
const TODO = 'code-corpus/explain/gold.todo.jsonl';
const DONE = 'code-corpus/explain/gold.jsonl';
const todo = fs.readFileSync(TODO, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const done = fs.existsSync(DONE) ? fs.readFileSync(DONE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const have = new Set(done.map(r => r.id));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(`រួចហើយ ${done.length}/${todo.length}. វាយ "." ចុងបន្ទាត់ដើម្បីបញ្ចប់ការពន្យល់, "skip" រំលង, "quit" ចេញ\n`);
for (const r of todo) {
  if (have.has(r.id)) continue;
  console.log('='.repeat(40), r.lang, r.id);
  console.log(r.code);
  console.log('-'.repeat(40));
  const lines = [];
  while (true) {
    const l = await rl.question(lines.length ? '… ' : 'ពន្យល់> ');
    if (l.trim() === 'quit') { rl.close(); process.exit(0); }
    if (l.trim() === 'skip' && !lines.length) break;
    if (l.trim() === '.') break;
    lines.push(l);
  }
  const text = lines.join('\n').trim();
  if (text) fs.appendFileSync(DONE, JSON.stringify({ id: r.id, lang: r.lang, code: r.code, explain_km: text }) + '\n');
}
console.log('ចប់ហើយ');
rl.close();
