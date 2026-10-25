#!/usr/bin/env python3
"""KHOEM guard: ឯកសារតែមួយ សម្រាប់ពិនិត្យ និងរក្សាទុកការងារ។
- ពិនិត្យ (អានតែប៉ុណ្ណោះ): ឯកសារចាំបាច់, ច្បាប់ចម្លងត្រូវដូចគ្នា, ទិន្នន័យ (schema, python syntax, leak),
  តេស្ត notebook/config, NOTICE, ឯកសារធំដែលមិនត្រូវ commit
- backup: tar.gz ទៅ Downloads/KHOEM_BACKUP (បន្ទាប់មកបើកមើលឡើងវិញ ផ្ទៀងផ្ទាត់ hash)
មិនលុប មិនកែ មិនសរសេរជាន់អ្វីទាំងអស់ក្រៅពីបង្កើត backup ថ្មី។
ប្រើ: python3 tools/guard.py [--no-backup] [--no-data]"""
import ast, hashlib, importlib.util, io, json, os, re, subprocess, sys, tarfile, time, warnings, collections
from pathlib import Path

warnings.filterwarnings("ignore")
HOME = Path.home()
ROOT = Path(os.environ.get("KHOEM_ROOT", HOME / "KHOEM_AI"))
DL = Path(os.environ.get("KHOEM_DL", HOME / "storage" / "downloads"))
TR, UP, BK = ROOT / "khoem-lora-trainer", DL / "KAGGLE_UPLOAD", DL / "KHOEM_BACKUP"
V1 = ROOT / "code-corpus" / "pairs.v1-keep"   # v1 ដែលបានបង្កក
FLAGS = {a for a in sys.argv[1:] if a.startswith("--")}
fails, warns = [], []

def ok(m): print("✅", m)
def bad(m): fails.append(m); print("❌", m)
def warn(m): warns.append(m); print("⚠️ ", m)
def sec(t): print(f"\n== {t} ==")
def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

# 1. ឯកសារចាំបាច់
sec("ឯកសារ")
for p in [TR / "notebooks/khoem_lora.ipynb", TR / "config.json", TR / "data/train.jsonl", TR / "data/valid.jsonl",
          TR / "data/test.jsonl", ROOT / "NOTICE", ROOT / "tools/make-pairs.mjs"]:
    (ok if p.exists() else bad)(f"{p.relative_to(ROOT)} {'មាន' if p.exists() else 'បាត់!'}")

# 2. ច្បាប់ចម្លងត្រូវដូចគ្នា
sec("ច្បាប់ចម្លង (ត្រូវដូចគ្នា)")
nb = TR / "notebooks/khoem_lora.ipynb"
pairs = [(TR / f"data/{n}.jsonl", UP / f"{n}.jsonl") for n in ("train", "valid", "test")]
pairs += [(nb, UP / "khoem_lora.ipynb"), (nb, DL / "khoem_lora.ipynb")]
for a, b in pairs:
    if not a.exists(): continue
    if not b.exists(): warn(f"{b.parent.name}/{b.name} មិនមាន (cp ម្តងទៀត)"); continue
    same = sha(a) == sha(b)
    frozen = (not same) and b.parent == UP and b.suffix == ".jsonl" and (V1 / b.name).exists() and sha(b) == sha(V1 / b.name)
    if frozen: ok(f"{b.parent.name}/{b.name} = v1 ដែលបានបង្កក (ខុសពី data/ បច្ចុប្បន្ន តែត្រូវនឹង pairs.v1-keep) [{sha(b)[:12]}]"); continue
    (ok if same else bad)(f"{b.parent.name}/{b.name} {'ដូចគ្នា' if same else 'ខុសពី repo (កុំ cp ទាល់តែដឹងថាមួយណាត្រូវ)'} [{sha(b)[:12]}]")

# 3. ទិន្នន័យ
if "--no-data" not in FLAGS:
    sec("ទិន្នន័យ")
    S = {}
    for n in ("train", "valid", "test"):
        p = TR / f"data/{n}.jsonl"
        if not p.exists(): continue
        rows, nbad, nsch, npy = [], 0, 0, 0
        for line in open(p, encoding="utf-8"):
            if not line.strip(): continue
            try: x = json.loads(line)
            except Exception: nbad += 1; continue
            try:
                m = x["messages"]
                assert len(m) >= 2 and m[0]["role"] == "user" and m[-1]["role"] == "assistant"
                assert str(m[-1]["content"]).strip() and x["lang"] and x["path"]
            except Exception: nsch += 1; continue
            if x["lang"] == "python":
                try: ast.parse(re.search(r"```python\n(.*?)```", m[-1]["content"], re.S).group(1))
                except Exception: npy += 1
            rows.append(x)
        S[n] = rows
        good = nbad == nsch == npy == 0
        (ok if good else bad)(f"{n}: {len(rows):,} ជួរ | JSON ខូច {nbad} | schema ខុស {nsch} | python syntax ខុស {npy}")
    if "train" in S: print("   ភាសា train:", dict(collections.Counter(x["lang"] for x in S["train"]).most_common(9)))
    if len(S) == 3:
        A = {n: {x["messages"][-1]["content"] for x in S[n]} for n in S}
        P = {n: {x["path"] for x in S[n]} for n in S}
        for a, b in (("train", "valid"), ("train", "test"), ("valid", "test")):
            la, lp = len(A[a] & A[b]), len(P[a] & P[b])
            (ok if la == 0 else bad)(f"leak {a}∩{b}: ចម្លើយ {la}")
            if lp: warn(f"path ដូចគ្នា {a}∩{b}: {lp} (ធម្មតាសម្រាប់បែងតាម repo មិនមែន leak)")

# 4. តេស្ត (ប្រើ tests/test_config.py ដែលមានស្រាប់)
sec("តេស្ត notebook/config")
tp = TR / "tests/test_config.py"
if tp.exists():
    try:
        spec = importlib.util.spec_from_file_location("khoem_tests", tp)
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        for n in sorted(x for x in dir(m) if x.startswith("test_")):
            try: getattr(m, n)(); ok(n)
            except Exception as e: bad(f"{n}: {repr(e)[:160]}")
    except Exception as e: bad(f"tests/test_config.py មិនអាចបើក: {repr(e)[:160]}")
else: warn("គ្មាន tests/test_config.py")

# 5. NOTICE
sec("NOTICE")
np_ = ROOT / "NOTICE"
if np_.exists():
    notice = np_.read_text(encoding="utf-8"); miss = []
    for rp in sorted((ROOT / "code-corpus").glob("*.report.json")):
        lab = rp.name[:-len(".report.json")]
        if lab == "khoem-own": continue
        try: c = json.loads(rp.read_text(encoding="utf-8")).get("git_commit", "")
        except Exception: c = ""
        if not c or c not in notice: miss.append(lab)
    (ok if not miss else warn)("repo ទាំងអស់មានក្នុង NOTICE" if not miss else f"repo ខ្វះក្នុង NOTICE ({len(miss)}): {miss[:8]}")

# 6. git: ឯកសារធំដែលមិនត្រូវ ignore (ការពារ commit ខុស)
sec("git (មុន commit)")
def git(*a): return subprocess.run(["git", "-C", str(ROOT), *a], capture_output=True, text=True, timeout=120)
try:
    if git("rev-parse", "--is-inside-work-tree").returncode == 0:
        st = git("status", "--short").stdout.splitlines()
        print(f"   កែ {sum(not l.startswith('??') for l in st)} | untracked {sum(l.startswith('??') for l in st)}")
        big = []
        for f in git("ls-files", "--others", "--exclude-standard").stdout.splitlines():
            q = ROOT / f
            if q.is_file() and q.stat().st_size > 5_000_000: big.append((f, round(q.stat().st_size / 1e6, 1)))
        (ok if not big else bad)("គ្មានឯកសារធំ >5MB ដែលមិនត្រូវ ignore" if not big else f"ឯកសារធំ មិនត្រូវ ignore (កុំ commit): {big[:5]}")
        mbig = [(f, round((ROOT / f).stat().st_size / 1e6, 1)) for f in git("ls-files", "-m").stdout.splitlines()
                if (ROOT / f).is_file() and (ROOT / f).stat().st_size > 5_000_000]
        if mbig: warn(f"ឯកសារធំដែល track ហើយត្រូវបានកែ (commit នឹងបន្ថែមទៅ history): {mbig[:4]}")
    else: warn("មិនមែន git repo")
except Exception as e: warn(f"git មិនអាចពិនិត្យ: {repr(e)[:100]}")

# 7. backup
if "--no-backup" not in FLAGS:
    sec("backup")
    F = set()
    for rel in ("NOTICE", "README.md", ".gitignore"): F.add(ROOT / rel)
    for g in ("tools/*.mjs", "tools/*.py", "tools/*.bak-*", "code-corpus/*.report.json", "*.bak-*"): F.update(ROOT.glob(g))
    for rel in ("notebooks/khoem_lora.ipynb", "config.json", "config.py", "train.py", "run_colab.py", "app.py", "check_data.py",
                "requirements.txt", "README.md", ".gitignore", "data/train.jsonl", "data/valid.jsonl", "data/test.jsonl"): F.add(TR / rel)
    for g in ("tests/*.py", "tests/*.bak-*", "notebooks/*.bak-*", "notebooks/_merge_backup_*/*", "*.bak-*", "data/*.bak-*"): F.update(TR.glob(g))
    F = sorted(p for p in F if p.is_file())
    BK.mkdir(parents=True, exist_ok=True)
    out = BK / time.strftime("khoem_%Y%m%d_%H%M%S") ; out = out.with_name(out.name + ("_FAIL" if fails else "") + ".tar.gz")
    assert not out.exists()
    man = []
    with tarfile.open(out, "w:gz") as t:
        for p in F:
            t.add(p, arcname=str(p.relative_to(ROOT))); man.append(f"{sha(p)}  {p.relative_to(ROOT)}")
        data = ("\n".join(man) + "\n").encode(); ti = tarfile.TarInfo("MANIFEST.sha256"); ti.size = len(data); ti.mtime = time.time()
        t.addfile(ti, io.BytesIO(data))
    want = dict(l.split("  ", 1)[::-1] for l in man); okn = 0
    with tarfile.open(out, "r:gz") as t:
        for mem in t.getmembers():
            if mem.name == "MANIFEST.sha256": continue
            h = hashlib.sha256(t.extractfile(mem).read()).hexdigest()
            if h == want.get(mem.name): okn += 1
    (ok if (F and okn == len(F)) else bad)(f"backup {okn}/{len(F)} ឯកសារ ផ្ទៀងផ្ទាត់ hash | {out.stat().st_size / 1e6:.1f} MB")
    print("   ", out)

print("\n" + "=" * 40)
print(f"សរុប: ❌ {len(fails)} | ⚠️  {len(warns)}")
for f in fails: print("  ❌", f)
for w in warns: print("  ⚠️ ", w)
sys.exit(1 if fails else 0)
