import json, re, random, os, sys, collections

random.seed(3407)
CAP = 600
VAL = 0.10
V2 = ["php", "swift", "kotlin", "dart"]
IN_T = "data_clean/final_train_v4.jsonl"
IN_V = "data_clean/final_valid_v4.jsonl"
OUT_T = "data_clean/final_train_v5.jsonl"
OUT_V = "data_clean/final_valid_v5.jsonl"

if os.path.exists(OUT_T) or os.path.exists(OUT_V):
    sys.exit("v5 មានរួចហើយ មិនជាន់ទេ")

F = re.compile(r"```(\w+)\n(.*?)\n```", re.S)

def load(p):
    return [json.loads(l) for l in open(p, encoding="utf-8") if l.strip()]

def norm(s):
    return re.sub(r"\s+", " ", s).strip()

def key(r):
    u, a = r["messages"][0]["content"], r["messages"][-1]["content"]
    m = F.search(u) or F.search(a)
    if not m:
        return None, None
    code = re.sub(r"^\s*(/\*\*.*?\*/|(///[^\n]*\n)+)\s*", "", m.group(2), flags=re.S)
    return m.group(1), norm(code)

train, valid = [], []

# 1) ភាសាចាស់ + ភាសាដែល leak: បញ្ចូល v4 ហើយបំបែកតាមក្រុមកូដ
groups = collections.defaultdict(list)
n = 0
for r in load(IN_T) + load(IN_V):
    l, k = key(r)
    if l in V2:
        continue
    if k is None:
        gid = ("none", n)
        n += 1
    else:
        gid = (l, k)
    groups[gid].append({"messages": r["messages"]})

by_lang = collections.defaultdict(list)
for gid, rows in groups.items():
    by_lang[gid[0]].append(rows)

for l, gl in sorted(by_lang.items()):
    random.shuffle(gl)
    nv = max(1, round(len(gl) * VAL))
    for g in gl[:nv]:
        valid.extend(g)
    for g in gl[nv:]:
        train.extend(g)

# 2) PHP/Swift/Kotlin/Dart: ពី v2 តាមអនុគមន៍ (៣ គូ)
for l in V2:
    rows = load(f"data/instruct_{l}.jsonl")
    gl = [rows[i:i + 3] for i in range(0, len(rows) - 2, 3)]
    bad = sum(1 for g in gl if len({x.get("path") for x in g}) != 1)
    if bad:
        print(f"ព្រមាន {l}: {bad} ក្រុមមាន path មិនដូចគ្នា")
    random.shuffle(gl)
    gl = gl[:CAP]
    nv = max(1, round(len(gl) * VAL))
    for g in gl[:nv]:
        valid.extend({"messages": x["messages"]} for x in g)
    for g in gl[nv:]:
        train.extend({"messages": x["messages"]} for x in g)
    print(f"{l}: functions={len(gl)} valid={nv} train={len(gl) - nv}")

random.shuffle(train)
random.shuffle(valid)
for path, rows in ((OUT_T, train), (OUT_V, valid)):
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
print("train:", len(train), " valid:", len(valid))

# 3) ពិនិត្យ leak តាមកូដអនុគមន៍ និងចំនួនតាមភាសា
trk = collections.defaultdict(set)
ct = collections.Counter()
for r in train:
    l, k = key(r)
    ct[l] += 1
    if k:
        trk[l].add(k)
cv, leak = collections.Counter(), collections.Counter()
for r in valid:
    l, k = key(r)
    cv[l] += 1
    if k and k in trk[l]:
        leak[l] += 1
print("== lang: train / valid / leak")
for l in sorted(set(ct) | set(cv), key=str):
    print(f"{str(l):12} {ct[l]:7} {cv[l]:6} {leak[l]:5}")
