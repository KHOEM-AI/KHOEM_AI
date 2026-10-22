import json, re, random, collections, os, sys

random.seed(3407)
APPLY = "--apply" in sys.argv
FRAC = 0.08
MIN_TEST = 50
IN_T = "data_clean/final_train_v5.jsonl"
IN_V = "data_clean/final_valid_v5.jsonl"
IN_X = "data_clean/final_test.jsonl"
OUT_T = "data_clean/final_train_v5b.jsonl"
OUT_X = "data_clean/final_test_v5b.jsonl"

if APPLY and any(os.path.exists(p) for p in (OUT_T, OUT_X)):
    sys.exit("v5b មានរួចហើយ មិនជាន់ទេ")

F = re.compile(chr(96) * 3 + r"(\w+)\n(.*?)\n" + chr(96) * 3, re.S)

def norm(s):
    return re.sub(r"\s+", " ", s).strip()

def key(r):
    m = F.search(r["messages"][0]["content"]) or F.search(r["messages"][-1]["content"])
    if not m:
        return None, None
    code = re.sub(r"^\s*(/\*\*.*?\*/|(///[^\n]*\n)+)\s*", "", m.group(2), flags=re.S)
    return m.group(1), norm(code)

def load(p):
    return [{"messages": json.loads(l)["messages"]} for l in open(p, encoding="utf-8") if l.strip()]

train, valid, old = load(IN_T), load(IN_V), load(IN_X)
tk = {key(r) for r in train if key(r)[1]}
vk = {key(r) for r in valid if key(r)[1]}

test, dropped = [], collections.Counter()
for r in old:
    kk = key(r)
    if kk[1] and (kk in tk or kk in vk):
        dropped[kk[0]] += 1
        continue
    test.append(r)
have = collections.Counter(key(r)[0] for r in test)

by = collections.defaultdict(dict)
n = 0
for r in train:
    l, k = key(r)
    gid = k if k else ("none", n)
    n += 1
    by[l].setdefault(gid, []).append(r)

newtrain, carved = [], collections.Counter()
for l in sorted(by, key=str):
    gl = list(by[l].values())
    if l is None or have[l] >= MIN_TEST:
        for g in gl:
            newtrain.extend(g)
        continue
    random.shuffle(gl)
    nt = max(1, round(len(gl) * FRAC))
    for g in gl[:nt]:
        test.extend(g)
        carved[l] += len(g)
    for g in gl[nt:]:
        newtrain.extend(g)
random.shuffle(newtrain)
random.shuffle(test)

def stat(rows):
    d, c = collections.defaultdict(set), collections.Counter()
    for r in rows:
        l, k = key(r)
        c[l] += 1
        if k:
            d[l].add(k)
    return d, c

T, V, X = stat(newtrain), stat(valid), stat(test)
print("test ចាស់ត្រូវលុប (ជាន់ train/valid):", dict(dropped))
print("ដកពី train ទៅ test:", dict(carved))
print("%-11s %6s %5s %5s | %s" % ("lang", "train", "valid", "test", "leak v&t x&t x&v"))
total = 0
for l in sorted(set(T[1]) | set(V[1]) | set(X[1]), key=str):
    a = len(V[0][l] & T[0][l])
    b = len(X[0][l] & T[0][l])
    c = len(X[0][l] & V[0][l])
    total += a + b + c
    print("%-11s %6d %5d %5d | %3d %3d %3d" % (str(l), T[1][l], V[1][l], X[1][l], a, b, c))
print("train:", len(newtrain), "valid:", len(valid), "test:", len(test), "| leak សរុប:", total)
if not APPLY:
    print("DRY-RUN: មិនបានសរសេរអ្វីទេ។ បន្ថែម --apply ដើម្បីសរសេរ។")
    sys.exit(0)
if total:
    sys.exit("មាន leak មិនសរសេរ")
for p, rows in ((OUT_T, newtrain), (OUT_X, test)):
    with open(p, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print("wrote", p, len(rows))
