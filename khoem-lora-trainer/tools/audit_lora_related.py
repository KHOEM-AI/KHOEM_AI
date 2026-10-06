import json
import hashlib
import os
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path.cwd()
HOME = Path.home()
KHOEM = HOME / "KHOEM_AI"
OLD = HOME / "KHOEM_AI_old_20261006_1005"
DOWNLOADS = HOME / "storage" / "downloads"

print("=" * 90)
print("KHOEM LoRA — FULL READ-ONLY AUDIT")
print("=" * 90)
print("ROOT:", ROOT)
print("KHOEM:", KHOEM)
print("NO FILES WILL BE MODIFIED.")
print()

def sha256(p):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda: f.read(1024 * 1024), b""):
            h.update(b)
    return h.hexdigest()

def show_file(label, p):
    print(f"\n--- {label} ---")
    print("path:", p)
    if not p.exists():
        print("STATUS: MISSING")
        return
    print("STATUS: EXISTS")
    print("size:", p.stat().st_size)
    print("sha256:", sha256(p))

def run(cmd):
    r = subprocess.run(
        cmd,
        cwd=ROOT,
        shell=True,
        capture_output=True,
        text=True,
    )
    print(r.stdout.rstrip())
    if r.stderr.strip():
        print("[stderr]")
        print(r.stderr.rstrip())

# ---------------------------------------------------------------------
# 1. Git
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("1. GIT STATE")
print("=" * 90)

run("git rev-parse --show-toplevel")
run("git branch --show-current")
run("git status --short")
run("git log --oneline -12")
run("git remote -v")

# ---------------------------------------------------------------------
# 2. Main trainer files
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("2. TRAINER SOURCE FILES")
print("=" * 90)

important = [
    "README.md",
    "app.py",
    "train.py",
    "run_colab.py",
    "config.py",
    "config.json",
    "check_data.py",
    "requirements.txt",
    "tests/test_config.py",
]

for name in important:
    show_file(name, ROOT / name)

# ---------------------------------------------------------------------
# 3. Dataset files
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("3. DATASETS")
print("=" * 90)

dataset_paths = [
    ROOT / "data" / "train.jsonl",
    ROOT / "data" / "valid.jsonl",
    ROOT / "data_clean" / "train.jsonl",
    ROOT / "data_clean" / "valid.jsonl",
]

for p in dataset_paths:
    show_file("DATA", p)

def inspect_jsonl(p):
    if not p.exists():
        return

    count = 0
    bad = 0
    roles_bad = 0
    langs = Counter()
    prompts = Counter()
    answers = Counter()
    paths = Counter()

    for line in p.open(encoding="utf-8"):
        if not line.strip():
            continue
        try:
            x = json.loads(line)
            count += 1
        except Exception:
            bad += 1
            continue

        if not isinstance(x, dict):
            bad += 1
            continue

        if "lang" in x:
            langs[x["lang"]] += 1
        if "path" in x:
            paths[x["path"]] += 1

        msgs = x.get("messages")
        if not isinstance(msgs, list):
            roles_bad += 1
            continue

        roles = tuple(m.get("role") for m in msgs if isinstance(m, dict))
        if "user" not in roles or "assistant" not in roles:
            roles_bad += 1

        if msgs:
            try:
                prompts[msgs[0]["content"]] += 1
                answers[msgs[-1]["content"]] += 1
            except Exception:
                pass

    print(f"\n{p.relative_to(ROOT)}")
    print("rows:", count)
    print("bad_json_or_object:", bad)
    print("bad_messages_roles:", roles_bad)
    print("duplicate_user_prompts:", sum(v > 1 for v in prompts.values()))
    print("duplicate_answers:", sum(v > 1 for v in answers.values()))
    print("languages:", dict(langs.most_common(20)))
    print("top_paths:", paths.most_common(10))

for p in dataset_paths:
    inspect_jsonl(p)

# ---------------------------------------------------------------------
# 4. Exact train/valid overlap — read only
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("4. TRAIN / VALID OVERLAP")
print("=" * 90)

def load_answers(p):
    if not p.exists():
        return set()
    out = set()
    for line in p.open(encoding="utf-8"):
        if not line.strip():
            continue
        try:
            x = json.loads(line)
            msgs = x.get("messages", [])
            if msgs:
                out.add(msgs[-1].get("content", ""))
        except Exception:
            pass
    return out

for base in ["data", "data_clean"]:
    trp = ROOT / base / "train.jsonl"
    vap = ROOT / base / "valid.jsonl"
    if trp.exists() and vap.exists():
        tr = load_answers(trp)
        va = load_answers(vap)
        print(base, "train_answers:", len(tr),
              "valid_answers:", len(va),
              "answer_overlap:", len(tr & va))

# ---------------------------------------------------------------------
# 5. Notebook inventory
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("5. NOTEBOOK INVENTORY")
print("=" * 90)

notebook_groups = [
    ("CURRENT", ROOT / "notebooks"),
    ("MERGE_BACKUP", ROOT / "notebooks" / "_merge_backup_20261006"),
    ("OLD_ARCHIVE", OLD),
    ("DOWNLOADS", DOWNLOADS),
]

all_notebooks = []

for label, directory in notebook_groups:
    print(f"\n[{label}] {directory}")
    if not directory.exists():
        print("DIRECTORY MISSING")
        continue

    files = sorted(directory.glob("khoem_lora*.ipynb"))
    for p in files:
        all_notebooks.append(p)
        print(
            p.name,
            "| size=", p.stat().st_size,
            "| sha256=", sha256(p)
        )

# ---------------------------------------------------------------------
# 6. Notebook deep audit
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("6. NOTEBOOK DEEP AUDIT")
print("=" * 90)

patterns = {
    "1.5B": "Qwen2.5-Coder-1.5B",
    "7B": "Qwen2.5-Coder-7B",
    "LR_1e-4": "1e-4",
    "LR_2e-4": "2e-4",
    "MAX_SEQ_2048": "2048",
    "RANK_8": "RANK",
    "MAX_TRAIN_ROWS": "MAX_TRAIN_ROWS",
    "FORCE_SAVE": "FORCE_SAVE",
    "get_peft_model": "get_peft_model",
    "HumanEval": "HumanEval",
    "for_inference": "for_inference",
    "for_training": "for_training",
    "SFTTrainer": "SFTTrainer",
    "processing_class": "processing_class",
    "tokenizer_arg": '["tokenizer"]',
    "train_jsonl": "train.jsonl",
    "valid_jsonl": "valid.jsonl",
    "save_pretrained": "save_pretrained",
}

for p in all_notebooks:
    print("\n" + "-" * 90)
    print("NOTEBOOK:", p)
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        print("INVALID JSON:", e)
        continue

    cells = d.get("cells", [])
    print("cells:", len(cells))
    print("code:", sum(c.get("cell_type") == "code" for c in cells))
    print("markdown:", sum(c.get("cell_type") == "markdown" for c in cells))

    text = "\n".join(
        "".join(c.get("source", []))
        for c in cells
    )

    for label, needle in patterns.items():
        print(f"{label}: {'YES' if needle in text else 'NO'}")

    for i, c in enumerate(cells):
        if c.get("cell_type") != "code":
            continue
        src = "".join(c.get("source", []))
        interesting = any(
            x in src for x in [
                "MODEL",
                "get_peft_model",
                "run_eval",
                "SFTTrainer",
                "train.jsonl",
                "valid.jsonl",
                "save_pretrained",
                "FORCE_SAVE",
            ]
        )
        if interesting:
            first = src.strip().splitlines()
            print(
                f"  cell {i}: "
                + " ".join(first[:3])[:300]
            )

# ---------------------------------------------------------------------
# 7. Source code references
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("7. TRAINING/DATA REFERENCES IN SOURCE")
print("=" * 90)

source_files = [
    ROOT / "train.py",
    ROOT / "run_colab.py",
    ROOT / "app.py",
    ROOT / "check_data.py",
    ROOT / "config.py",
    ROOT / "config.json",
    ROOT / "README.md",
]

for p in source_files:
    if not p.exists():
        continue
    text = p.read_text(encoding="utf-8", errors="replace")
    print("\n", p.relative_to(ROOT))
    for needle in [
        "train.jsonl",
        "valid.jsonl",
        "data_clean",
        "Qwen2.5-Coder",
        "HumanEval",
        "get_peft_model",
        "SFTTrainer",
        "SFTConfig",
        "save_pretrained",
        "learning_rate",
        "max_seq_length",
        "lora_rank",
    ]:
        hits = text.count(needle)
        if hits:
            print(f"  {needle}: {hits}")

# ---------------------------------------------------------------------
# 8. Code corpus / pair outputs
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("8. CODE CORPUS / PAIRS")
print("=" * 90)

for directory in [
    KHOEM / "code-corpus",
    KHOEM / "tools",
]:
    print("\nDIR:", directory)
    if not directory.exists():
        print("MISSING")
        continue

    for p in sorted(directory.glob("*")):
        if p.is_file():
            print(p.relative_to(KHOEM), p.stat().st_size)

# ---------------------------------------------------------------------
# 9. Code corpus report summary
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("9. CODE CORPUS REPORTS")
print("=" * 90)

for p in sorted((KHOEM / "code-corpus").glob("*.report.json")):
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        continue

    print("\n", p.name)
    for key in [
        "repo",
        "license",
        "git_commit",
        "language",
        "files",
        "examples",
        "pairs",
    ]:
        if key in d:
            print(f"  {key}: {d[key]}")

# ---------------------------------------------------------------------
# 10. Generated pair counts
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("10. PAIR COUNTS")
print("=" * 90)

for p in [
    KHOEM / "code-corpus" / "pairs" / "train.jsonl",
    KHOEM / "code-corpus" / "pairs" / "valid.jsonl",
    KHOEM / "code-corpus" / "pairs" / "test.jsonl",
]:
    if p.exists():
        print(p, "lines=", sum(1 for _ in p.open(encoding="utf-8")))

# ---------------------------------------------------------------------
# 11. Relevant scripts
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("11. RELEVANT SCRIPTS")
print("=" * 90)

for directory in [
    ROOT,
    KHOEM / "tools",
]:
    if not directory.exists():
        continue
    for p in sorted(directory.glob("*")):
        if p.suffix in {".py", ".mjs", ".sh"} and p.is_file():
            text = p.read_text(encoding="utf-8", errors="replace")
            if any(
                x in text
                for x in [
                    "jsonl",
                    "make-pairs",
                    "train",
                    "valid",
                    "HumanEval",
                    "LoRA",
                ]
            ):
                print(p)

# ---------------------------------------------------------------------
# 12. Final duplicate-name report
# ---------------------------------------------------------------------
print("\n" + "=" * 90)
print("12. DUPLICATE / VERSION REPORT")
print("=" * 90)

names = Counter(p.name for p in all_notebooks)
for name, n in names.items():
    if n > 1:
        print("DUPLICATE NAME:", name, "count=", n)

print("\nCanonical expected:")
print(ROOT / "notebooks" / "khoem_lora.ipynb")

print("\nAudit finished. READ-ONLY.")
print("=" * 90)
