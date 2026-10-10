import json, random, shutil, sys, time
from collections import Counter
random.seed(3407)
APPLY = "--apply" in sys.argv
SRC = "data/instruct_all_tsjs.jsonl"
rows = [json.loads(l) for l in open(SRC, encoding="utf-8") if l.strip()]
groups, dropped = [], 0
for i in range(0, len(rows), 3):
    g = rows[i:i + 3]
    ok = (len(g) == 3 and len({r["lang"] for r in g}) == 1
          and all(len(r["messages"]) == 2 for r in g)
          and all(r["messages"][1]["content"].count("```") == 2 for r in g))
    if ok:
        groups.append(g)
    else:
        dropped += len(g)
random.shuffle(groups)
n = len(groups)
a, b = int(n * 0.9), int(n * 0.95)
parts = {"train": groups[:a], "valid": groups[a:b], "test": groups[b:]}
print("rows in:", len(rows), "| dropped (bad fence):", dropped, "| functions kept:", n)
for k, v in parts.items():
    c = Counter(g[0]["lang"] for g in v)
    print("%-6s functions=%5d rows=%6d %s" % (k, len(v), len(v) * 3, dict(c)))
if not APPLY:
    print("\nDRY-RUN only. Nothing written. Add --apply to write.")
    sys.exit(0)
stamp = time.strftime("%Y%m%d_%H%M%S")
for k, v in parts.items():
    p = "data_clean/final_%s.jsonl" % k
    shutil.copy(p, p + ".bak_" + stamp)
    with open(p, "a", encoding="utf-8") as f:
        for g in v:
            for r in g:
                f.write(json.dumps({"messages": r["messages"]}, ensure_ascii=False) + "\n")
    print("appended", k, "backup:", p + ".bak_" + stamp)
