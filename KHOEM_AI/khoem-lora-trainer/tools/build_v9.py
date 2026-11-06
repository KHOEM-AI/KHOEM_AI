import json, re, random, os, sys, collections
random.seed(3407)
VAL, CAP = 0.10, 2500
LANGS = ["php", "swift", "kotlin"]
IN_T, IN_V = "data_clean/final_train_v8.jsonl", "data_clean/final_valid_v8b.jsonl"
IN_TEST = "data_clean/final_test_v5b.jsonl"
OUT_T, OUT_V = "data_clean/final_train_v9.jsonl", "data_clean/final_valid_v9.jsonl"
if os.path.exists(OUT_T) or os.path.exists(OUT_V):
    sys.exit("v9 មានរួចហើយ មិនជាន់ទេ")
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
train = [r for r in load(IN_T) if key(r)[0] not in LANGS]
valid = [r for r in load(IN_V) if key(r)[0] not in LANGS]
test = load(IN_TEST)
for l in LANGS:
    tk = {key(r)[1] for r in test if key(r)[0] == l}
    rows = load(f"data/instruct_{l}_v8.jsonl")
    gl, seen = [], set()
    for i in range(0, len(rows) - 2, 3):
        g = rows[i:i+3]
        k = key(g[0])[1]
        if k in tk or k in seen: continue
        seen.add(k); gl.append(g)
    random.shuffle(gl)
    total = len(gl); gl = gl[:CAP]
    nv = max(1, round(len(gl) * VAL))
    for g in gl[:nv]: valid.extend(strip(g))
    for g in gl[nv:]: train.extend(strip(g))
    print(f"{l}: unique={total} used={len(gl)} valid={nv}")
random.shuffle(train); random.shuffle(valid)
for p, rs in ((OUT_T, train), (OUT_V, valid)):
    with open(p, "w", encoding="utf-8") as f:
        for r in rs: f.write(json.dumps(r, ensure_ascii=False) + "\n")
trk = collections.defaultdict(set); ct = collections.Counter()
for r in train:
    l, k = key(r); ct[l] += 1
    if k: trk[l].add(k)
cv, leak = collections.Counter(), collections.Counter()
for r in valid:
    l, k = key(r); cv[l] += 1
    if k and k in trk[l]: leak[l] += 1
print("train:", len(train), "valid:", len(valid))
print("== lang: train / valid / leak")
for l in sorted(set(ct) | set(cv), key=str):
    print(f"{str(l):12} {ct[l]:7} {cv[l]:6} {leak[l]:5}")
