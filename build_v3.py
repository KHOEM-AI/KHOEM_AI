import sentencepiece as spm, array, hashlib, os, re, glob, json
sp = spm.SentencePieceProcessor(model_file="khoem_bpe16k_v2.model")
base = "KHOEM_AI/corpus-sample/"
zw = re.compile(r"[\u200b\u200c\u200d\u2060\ufeff]")
ws = re.compile(r"\s+")
H = lambda s: hashlib.md5(ws.sub("", s).encode()).digest()
out = "khoem16k_v3_data"; os.makedirs(out, exist_ok=True)
eos = sp.eos_id()
tr = open(f"{out}/train.bin", "wb"); va = open(f"{out}/val.bin", "wb")
cnt = {"train": 0, "val": 0}; seen = set(); buf = []

def flush():
    global buf
    if not buf: return
    for l, ids in zip(buf, sp.encode(buf)):
        is_val = hashlib.md5(l.encode()).digest()[0] % 100 == 0
        a = array.array("H", ids + [eos])
        (va if is_val else tr).write(a.tobytes())
        cnt["val" if is_val else "train"] += len(a)
    buf = []

def add(l):
    l = l.strip()
    if len(l) < 5: return
    h = H(l)
    if h in seen: return
    seen.add(h); buf.append(l)
    if len(buf) >= 5000: flush()

for f in ["raw/kmwiki-clean.txt", "raw/voa-sample.txt"]:
    for l in open(base + f, encoding="utf-8"): add(l)
flush()
print("old sources:", dict(cnt), flush=True)

for p in sorted(glob.glob(base + "raw/voa_extracted/**/article/*.json", recursive=True)):
    try: d = json.load(open(p, encoding="utf-8"))
    except Exception: continue
    for para in d.get("paragraphs", []): add(zw.sub("", para))
flush(); tr.close(); va.close()
print("final:", cnt, "| total:", sum(cnt.values()))
