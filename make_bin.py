import sentencepiece as spm, os
from array import array
home = os.path.expanduser("~/KHOEM_AI")
raw = home + "/KHOEM_AI/corpus-sample/raw/"
out = home + "/khoem75m_data/"
os.makedirs(out, exist_ok=True)
sp = spm.SentencePieceProcessor(model_file=home + "/khoem_bpe16k.model")
EOS = sp.eos_id()
tr = open(out + "train.bin", "wb"); va = open(out + "val.bin", "wb")
nt = nv = i = 0
for name in ("kmwiki-clean.txt", "voa-sample.txt"):
    batch = []
    def flush():
        global nt, nv, i
        for ids in sp.encode(batch):
            ids.append(EOS)
            a = array("H", ids)
            if i % 200 == 0:
                a.tofile(va); nv += len(a)
            else:
                a.tofile(tr); nt += len(a)
            i += 1
    for line in open(raw + name, encoding="utf-8"):
        line = line.strip()
        if len(line) < 10:
            continue
        batch.append(line)
        if len(batch) >= 5000:
            flush(); batch = []
    if batch:
        flush()
tr.close(); va.close()
print(f"train_tokens={nt:,} val_tokens={nv:,} lines={i:,}")
