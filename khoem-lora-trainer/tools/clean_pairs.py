# Read-only on data/; writes data_clean/. Keeps bilingual pairs together.
import json, re, random, collections, hashlib
from pathlib import Path
random.seed(3407)
MIN_CHARS, MAX_CHARS = 120, 4000
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8')]
rows = load('data/train.jsonl') + load('data/valid.jsonl') + load('data/test.jsonl')
by_ans = collections.defaultdict(list)
for r in rows: by_ans[r['messages'][-1]['content']].append(r)
def lang(u):
    for k in ('rust','python','cpp','java','go','ts','js','c'):
        if re.search(r'\b'+k+r'\b', u.lower()): return k
    return 'other'
groups = []
for a, rs in by_ans.items():
    if not (MIN_CHARS <= len(a) <= MAX_CHARS): continue
    if a.count('\n') < 3: continue
    groups.append((lang(rs[0]['messages'][0]['content']), a, rs))
cap = {'rust': 3000}                      # cap the dominant language
byl = collections.defaultdict(list)
for g in groups: byl[g[0]].append(g)
kept = []
for l, gs in byl.items():
    random.shuffle(gs); kept += gs[:cap.get(l, len(gs))]
# split by answer-hash so no answer crosses splits
def bucket(a): return int(hashlib.sha256(a.encode()).hexdigest(), 16) % 100
out = {'train': [], 'valid': [], 'test': []}
for l, a, rs in kept:
    b = bucket(a); s = 'test' if b < 6 else 'valid' if b < 14 else 'train'
    out[s] += rs
for s, rs in out.items():
    random.shuffle(rs)
    with open(f'data_clean/{s}.jsonl', 'w', encoding='utf-8') as f:
        for r in rs: f.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(s, len(rs))
print('languages kept:', collections.Counter(g[0] for g in kept).most_common())
