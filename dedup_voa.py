import tarfile, hashlib, re
KH = re.compile(r"[\u1780-\u17FF]")
seen = set()
files = dup = 0
kh_all = kh_uniq = 0
with tarfile.open("KHOEM_AI/corpus-sample/raw/khm_khmer_voanews.tgz") as t:
    for m in t:
        if not m.isfile():
            continue
        b = t.extractfile(m).read()
        txt = b.decode("utf-8", "ignore")
        norm = " ".join(txt.split())
        h = hashlib.sha1(norm.encode()).digest()
        k = len(KH.findall(txt))
        files += 1
        kh_all += k
        if h in seen:
            dup += 1
        else:
            seen.add(h)
            kh_uniq += k
print(f"files={files} exact_dup_files={dup} khmer_chars_all={kh_all:,} khmer_chars_unique={kh_uniq:,}")
