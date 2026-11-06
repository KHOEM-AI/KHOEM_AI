import json, glob, hashlib, random
from collections import Counter, defaultdict
random.seed(3407)
CAP_FUNCS = 400
TARGET = 5000

def ok(r):
    m = r.get("messages", [])
    if len(m) != 2 or m[0].get("role") != "user" or m[1].get("role") != "assistant":
        return False
    a = m[1].get("content", "").strip()
    return a.startswith("```") and a.endswith("```") and len(m[0].get("content", "")) > 20

pools = defaultdict(lambda: defaultdict(list))
for f in sorted(glob.glob("data/instruct_*.jsonl")):
    name = f[len("data/instruct_"):-6]
    if name == "all_tsjs":
        continue
    rows = [json.loads(l) for l in open(f, encoding="utf-8") if l.strip()]
    for i in range(0, len(rows), 3):
        g = rows[i:i + 3]
        if len(g) == 3 and all(ok(r) for r in g) and len({r["lang"] for r in g}) == 1:
            pools[g[0]["lang"]][name].append(g)

out, seen, per = [], set(), Counter()
for lg in ("typescript", "javascript"):
    for name in pools[lg]:
        random.shuffle(pools[lg][name])
        pools[lg][name] = pools[lg][name][:CAP_FUNCS]
    n = 0
    while n + 3 <= TARGET and any(pools[lg].values()):
        for name in sorted(pools[lg]):
            if n + 3 > TARGET:
                break
            if not pools[lg][name]:
                continue
            g = pools[lg][name].pop()
            hs = [hashlib.sha256(json.dumps(r["messages"], ensure_ascii=False, sort_keys=True).encode()).hexdigest() for r in g]
            if any(h in seen for h in hs):
                continue
            seen.update(hs)
            out.extend(g)
            n += 3
            per[(lg, name)] += 3

with open("data/instruct_all_tsjs.jsonl", "w", encoding="utf-8") as fo:
    for r in out:
        fo.write(json.dumps(r, ensure_ascii=False) + "\n")
for (lg, name), v in sorted(per.items()):
    print("%-11s %-15s %5d" % (lg, name, v))
c = Counter(r["lang"] for r in out)
print("TOTAL:", len(out), dict(c))
