# KHOEM tidy: one name per file, merge train sets without leakage, move old files to a backup folder.
# python3 tidy.py          -> report only (changes nothing)
# python3 tidy.py --apply  -> do it (old files are MOVED to ~/KHOEM_AI_old_*, never deleted)
import os, sys, json, glob, shutil, time
H = os.path.expanduser("~")
DL = os.path.join(H, "storage/downloads")
TR = os.path.join(H, "KHOEM_AI/khoem-lora-trainer")
DATA, NB = os.path.join(TR, "data"), os.path.join(TR, "notebooks")
OLD = os.path.join(H, "KHOEM_AI_old_" + time.strftime("%Y%m%d_%H%M"))
APPLY = "--apply" in sys.argv

def rows(p):
    out = []
    if os.path.exists(p):
        for l in open(p, encoding="utf-8"):
            l = l.strip()
            if l:
                try: out.append(json.loads(l))
                except Exception: pass
    return out

def key(r):
    m = r.get("messages", [])
    return (next((x["content"] for x in m if x["role"] == "user"), ""),
            next((x["content"] for x in m if x["role"] == "assistant"), ""))

big = rows(os.path.join(DATA, "train.jsonl"))
small = rows(os.path.join(DL, "train.jsonl"))
val = rows(os.path.join(DATA, "valid.jsonl"))
dval = rows(os.path.join(DL, "valid.jsonl"))
if not big or not val:
    sys.exit("STOP: train/valid ក្នុង khoem-lora-trainer/data រកមិនឃើញ")

val_ans = {key(r)[1] for r in val}
seen = set(); merged = []; dups = 0
for r in big:
    k = key(r)
    if k in seen: dups += 1; continue
    seen.add(k); merged.append(r)
added = leak = 0
for r in small:
    k = key(r)
    if k[1] in val_ans: leak += 1; continue
    if k in seen: continue
    seen.add(k); merged.append(r); added += 1

print(f"train ធំ={len(big)}  train តូច(Downloads)={len(small)}")
print(f"ស្ទួនក្នុង train ធំ (ដកចេញ)={dups}")
print(f"ពី train តូច: បន្ថែមថ្មី={added}  ដកចេញព្រោះចម្លើយនៅក្នុង valid (leak)={leak}")
print(f"train ចុងក្រោយ={len(merged)}  valid={len(val)}")
print("valid Downloads ដូច valid ក្នុង data:", {key(r) for r in val} == {key(r) for r in dval})

dl = lambda *n: os.path.join(DL, *n)
old_files = [dl(n) for n in ["khoem_lora.ipynb", "khoem_lora_fixed.ipynb", "khoem_lora_clean-1.ipynb",
             "khoem_lora_clean.ipynb", "khoem-lora-trainer.zip", "khoem-backup.zip", "khoem-backup2.zip"]]
for pat in ("train*.jsonl", "valid*.jsonl", "code-corpus*.mjs", "analyze_pairs*"):
    old_files += glob.glob(dl(pat))
old_files = sorted({f for f in old_files if os.path.exists(f)})
print("\nនឹងផ្លាស់ទៅ", OLD)
for f in old_files: print("  ", os.path.basename(f))
print("\nចុងក្រោយនៅ Downloads: train.jsonl valid.jsonl khoem_lora_kaggle.ipynb")
print("ចុងក្រោយនៅ trainer: data/train.jsonl data/valid.jsonl notebooks/khoem_lora_kaggle.ipynb notebooks/khoem_lora_colab.ipynb")

if not APPLY:
    print("\n(គ្រាន់តែបង្ហាញ មិនទាន់ប៉ះអ្វីទេ។ អនុវត្ត: python3 tidy.py --apply)"); sys.exit()

os.makedirs(OLD); os.makedirs(NB, exist_ok=True)
if os.path.exists(dl("khoem_lora_kaggle.ipynb")): shutil.copy(dl("khoem_lora_kaggle.ipynb"), os.path.join(NB, "khoem_lora_kaggle.ipynb"))
if os.path.exists(dl("khoem_lora_clean.ipynb")): shutil.copy(dl("khoem_lora_clean.ipynb"), os.path.join(NB, "khoem_lora_colab.ipynb"))
shutil.copy(os.path.join(DATA, "train.jsonl"), os.path.join(OLD, "train_data_before_merge.jsonl"))
for f in old_files:
    dest = os.path.join(OLD, os.path.basename(f)); i = 1
    while os.path.exists(dest): dest = os.path.join(OLD, f"{i}_{os.path.basename(f)}"); i += 1
    shutil.move(f, dest)
with open(os.path.join(DATA, "train.jsonl"), "w", encoding="utf-8") as w:
    for r in merged: w.write(json.dumps(r, ensure_ascii=False) + "\n")
shutil.copy(os.path.join(DATA, "train.jsonl"), dl("train.jsonl"))
shutil.copy(os.path.join(DATA, "valid.jsonl"), dl("valid.jsonl"))
print("\nរួចរាល់។ ឯកសារចាស់ទាំងអស់នៅ", OLD)
