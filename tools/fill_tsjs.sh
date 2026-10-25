#!/usr/bin/env bash
cd ~/KHOEM_AI || exit 1

echo "=== 1. PATCH ts_pairs.py ==="
python3 - <<'PY'
p = "khoem-lora-trainer/tools/ts_pairs.py"
lines = open(p, encoding="utf-8").read().split("\n")
if any("re.split" in l and "@" in l for l in lines):
    print("already patched")
else:
    out = []
    done = False
    for l in lines:
        out.append(l)
        if (not done) and l.strip().startswith("doc = doc.split("):
            ind = l[: len(l) - len(l.lstrip())]
            out.append(ind + "doc = re.split(r'\\s@\\w+', doc)[0].strip()")
            done = True
    assert done, "patch point not found"
    open(p, "w", encoding="utf-8").write("\n".join(out))
    print("patched")
PY

echo "=== 2. CLONE ==="
NEW="vite:vitejs/vite prettier:prettier/prettier eslint:eslint/eslint nest:nestjs/nest fastify:fastify/fastify redux-toolkit:reduxjs/redux-toolkit query:TanStack/query date-fns:date-fns/date-fns moment:moment/moment socket-io:socketio/socket.io ramda:ramda/ramda commander:tj/commander.js yargs:yargs/yargs immutable:immutable-js/immutable-js"
mkdir -p repos
NAMES="zod typeorm trpc vue-core axios lodash"
for p in $NEW; do
  n=${p%%:*}; r=${p#*:}
  if [ ! -d repos/$n ]; then
    git clone -q --depth 1 https://github.com/$r repos/$n || { echo "SKIP clone $n"; continue; }
  fi
  NAMES="$NAMES $n"
done

echo "=== 3. CORPUS + PAIRS ==="
for n in $NAMES; do
  if [ ! -f code-corpus/$n.jsonl ]; then
    src=repos/$n
    [ "$n" = "zod" ] && src=repos/zod/packages/zod/src
    node tools/code-corpus.mjs --root $src --license auto --label $n 2>&1 | head -2
  fi
  if [ -f code-corpus/$n.jsonl ]; then
    (cd khoem-lora-trainer && python3 tools/ts_pairs.py $n | sed "s/^/[$n] /")
  else
    echo "SKIP corpus $n (license or error)"
  fi
done

echo "=== 4. VALIDATE + MERGE ==="
cd khoem-lora-trainer
python3 - <<'PY'
import json, glob, hashlib, random
from collections import Counter
random.seed(3407)
CAP = 200
def ok(r):
    m = r.get("messages", [])
    if len(m) != 2 or m[0].get("role") != "user" or m[1].get("role") != "assistant":
        return False
    a = m[1].get("content", "").strip()
    return a.startswith("```") and a.endswith("```") and len(m[0].get("content", "")) > 20
out, seen, bad = [], set(), 0
print("%-16s %6s %6s" % ("repo", "found", "kept"))
for f in sorted(glob.glob("data/instruct_*.jsonl")):
    if f.endswith("instruct_all_tsjs.jsonl"):
        continue
    rows = [json.loads(l) for l in open(f, encoding="utf-8") if l.strip()]
    groups = [rows[i:i + 3] for i in range(0, len(rows), 3)]
    good = []
    for g in groups:
        if all(ok(r) for r in g):
            good.append(g)
        else:
            bad += len(g)
    random.shuffle(good)
    kept = 0
    for g in good[:CAP]:
        for r in g:
            h = hashlib.sha256(json.dumps(r["messages"], ensure_ascii=False, sort_keys=True).encode()).hexdigest()
            if h in seen:
                continue
            seen.add(h)
            out.append(r)
            kept += 1
    print("%-16s %6d %6d" % (f[len("data/instruct_"):-6], len(rows), kept))
with open("data/instruct_all_tsjs.jsonl", "w", encoding="utf-8") as fo:
    for r in out:
        fo.write(json.dumps(r, ensure_ascii=False) + "\n")
cur = Counter()
for l in open("data/train.jsonl", encoding="utf-8"):
    if l.strip():
        cur[json.loads(l).get("lang", "?")] += 1
new = Counter(r["lang"] for r in out)
print("\ninvalid rows dropped:", bad)
print("%-12s %8s %8s %8s %8s" % ("lang", "current", "new", "total", "target"))
for lg in ("typescript", "javascript"):
    print("%-12s %8d %8d %8d %8d" % (lg, cur[lg], new[lg], cur[lg] + new[lg], 20000))
print("wrote data/instruct_all_tsjs.jsonl rows:", len(out))
PY
echo "=== DONE ==="
