import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const src = 'corpus-sample';
const base = JSON.parse(fs.readFileSync(`${src}/manifest.json`, 'utf8'));
const good = base.datasets.find(d => d.dataset_id === 'sample-km-general-001');
let fail = 0;
const ok = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) fail++; };

const cases = [
  ['rights approved + privacy pending', { privacy_review_status: 'pending' }],
  ['rights pending + privacy passed', { rights_review_status: 'pending' }],
  ['quality unreviewed', { quality_status: 'unreviewed' }],
  ['processing_status rights_review', { processing_status: 'rights_review' }],
];

for (const [name, patch] of cases) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
  const dir = path.join(tmp, 'corpus-sample');
  fs.mkdirSync(dir);
  fs.cpSync(`${src}/raw`, path.join(dir, 'raw'), { recursive: true });
  fs.copyFileSync(`${src}/pipeline.mjs`, path.join(dir, 'pipeline.mjs'));
  const d = { ...JSON.parse(JSON.stringify(good)), dataset_id: 'gate-fixture', ...patch };
  fs.writeFileSync(path.join(dir, 'manifest.json'),
    JSON.stringify({ ...base, datasets: [d] }, null, 2));
  try {
    execFileSync('node', ['corpus-sample/pipeline.mjs'], { cwd: tmp, stdio: 'pipe' });
    const r = JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8'));
    const b = (r.blocked || []).find(x => x.dataset_id === 'gate-fixture');
    ok(`${name}: blocked with reason`, !!b && b.reasons.length > 0);
    ok(`${name}: not in sources`, !(r.sources || []).some(s => s.dataset_id === 'gate-fixture'));
    ok(`${name}: eligibleWords 0`, r.eligibleWords === 0);
  } catch (e) {
    ok(`${name}: pipeline ran (${String(e.stderr || e.message).split('\n')[0]})`, false);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(fail ? 1 : 0);
