import tarfile, json, re, os, hashlib
KH = re.compile(r"[\u1780-\u17FF]")
home = os.path.expanduser("~/KHOEM_AI")
src = home + "/KHOEM_AI/corpus-sample/raw/khm_khmer_voanews.tgz"
out = home + "/KHOEM_AI/corpus-sample/raw/voa-sample.txt"
seen = set(); n = 0; files = 0; chars = 0
with tarfile.open(src) as t, open(out, "w", encoding="utf-8") as f:
    for m in t:
        if not m.isfile():
            continue
        try:
            d = json.loads(t.extractfile(m).read().decode("utf-8", "ignore"))
        except Exception:
            continue
        files += 1
        for para in d.get("sentences") or []:
            for s in para:
                s = " ".join(s.replace("\u200b", "").split())
                if len(s) < 10:
                    continue
                if len(KH.findall(s)) < 0.5 * len(s):
                    continue
                h = hashlib.sha1(s.encode()).digest()
                if h in seen:
                    continue
                seen.add(h)
                f.write(s + "\n")
                n += 1
                chars += len(KH.findall(s))
print(f"files={files} lines={n} khmer_chars={chars:,}")
