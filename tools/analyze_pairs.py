import json, os, re, collections, statistics, sys
D = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/KHOEM_AI/khoem-lora-trainer/data")
KH = re.compile(r"[\u1780-\u17FF]")

def load(name):
    rows = []
    for l in open(os.path.join(D, name), encoding="utf-8"):
        l = l.strip()
        if l:
            try: rows.append(json.loads(l))
            except Exception: pass
    return rows

def user(r): return next((m["content"] for m in r.get("messages", []) if m["role"] == "user"), "")
def asst(r): return next((m["content"] for m in r.get("messages", []) if m["role"] == "assistant"), "")
def top(it, n=5): return ", ".join(f"{k}={v}" for k, v in collections.Counter(it).most_common(n))

S = {n: load(n + ".jsonl") for n in ("train", "valid")}
for n, rows in S.items():
    u = [user(r) for r in rows]; a = [asst(r) for r in rows]
    kh = sum(bool(KH.search(x)) for x in u)
    print(f"\n== {n}: {len(rows)} rows")
    print(f"prompt ខ្មែរ={kh}  អង់គ្លេស={len(rows)-kh}")
    print("lang:", top([r.get("lang", "?") for r in rows], 8))
    print(f"prompt ខុសគ្នា={len(set(u))}/{len(u)}")
    print("prompt ញឹកបំផុត:", top(u, 3)[:200])
    if a: print(f"ចម្លើយ chars median={int(statistics.median(len(x) for x in a))} max={max(len(x) for x in a)}")
    print("មាន code fence:", sum("```" in x for x in a))
    print("ថតកំពូល:", top([r.get("path", "?").split("/")[0] for r in rows], 6))
tp = {r.get("path") for r in S["train"]}; vp = {r.get("path") for r in S["valid"]}
ta = {asst(r) for r in S["train"]}; va = [asst(r) for r in S["valid"]]
print(f"\npath ត្រួតគ្នា train∩valid = {len(tp & vp)}")
print(f"ចម្លើយ valid ដូចគ្នាពិត train = {sum(x in ta for x in va)}/{len(va)}")
