import json, re, random, os, sys, collections
random.seed(3407)
VAL = 0.10
IN_T, IN_V = "data_clean/final_train_v7.jsonl", "data_clean/final_valid_v5b.jsonl"
IN_TEST = "data_clean/final_test_v5b.jsonl"
DART = "data/instruct_dart_v8.jsonl"
OUT_T, OUT_V = "data_clean/final_train_v8.jsonl", "data_clean/final_valid_v8.jsonl"
if os.path.exists(OUT_T) or os.path.exists(OUT_V):
    sys.exit("v8 មានរួចហើយ មិនជាន់ទេ")
F = re.compile(r"```(\w+)\n(.*?)\n```", re.S)
def load(p): return [json.loads(l) for l in open(p, encoding="utf-8") if l.strip()]
def norm(s): return re.sub(r"\s+", " ", s).strip()
def key(r):
    u, a = r["messages"][0]["content"], r["messages"][-1]["content"]
    m = F.search(u) or F.search(a)
    if not m: return None, None
    code = re.sub(r"^\s*(/\*\*.*?\*/|(///[^\n]*\n)+)\s*", "", m.group(2), flags=re.S)
    return m.group(1), norm(code)
def strip(rows): return [{"messages": r["messages"]} for r in rows]
train = [r for r in load(IN_T) if key(r)[0] != "dart"]
valid = [r for r in load(IN_V) if key(r)[0] != "dart"]
test_keys = {key(r)[1] for r in load(IN_TEST) if key(r)[0] == "dart"}
rows = load(DART)
gl = [rows[i:i+3] for i in range(0, len(rows)-2, 3)]
gl = [g for g in gl if key(g[0])[1] not in test_keys]
random.shuffle(gl)
nv = max(1, round(len(gl) * VAL))
for g in gl[:nv]: valid.extend(strip(g))
for g in gl[nv:]: train.extend(strip(g))
random.shuffle(train); random.shuffle(valid)
for p, rs in ((OUT_T, train), (OUT_V, valid)):
    with open(p, "w", encoding="utf-8") as f:
        for r in rs: f.write(json.dumps(r, ensure_ascii=False) + "\n")
print("dart functions:", len(gl), "valid:", nv, "| train:", len(train), "valid:", len(valid))
trk = collections.defaultdict(set); ct = collections.Counter()
for r in train:
    l, k = key(r); ct[l] += 1
    if k: trk[l].add(k)
cv, leak = collections.Counter(), collections.Counter()
for r in valid:
    l, k = key(r); cv[l] += 1
    if k and k in trk[l]: leak[l] += 1
print("== lang: train / valid / leak")
for l in sorted(set(ct) | set(cv), key=str):
    print(f"{str(l):12} {ct[l]:7} {cv[l]:6} {leak[l]:5}")
