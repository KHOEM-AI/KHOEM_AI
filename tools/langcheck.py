#!/usr/bin/env python3

import os
import sys
import json
import ast
import re
import shutil
import subprocess
import tempfile
import collections
import hashlib
import random

ROOT = os.path.expanduser(sys.argv[sys.argv.index("--root") + 1]) if "--root" in sys.argv else os.path.expanduser("~/KHOEM_AI")
DATA = os.path.join(ROOT, "khoem-lora-trainer", "data")
OUT = os.path.join(ROOT, "lang-check")
N = 200

EXT = {
    ".py": "python",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".sh": "shell",
    ".bash": "shell",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".hpp": "cpp",
    ".rs": "rust",
    ".go": "go",
    ".java": "java",
    ".json": "json",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".dart": "dart",
}

SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", "coverage",
    "__pycache__", "venv", ".venv", "vendor",
    "raw", "extracted", "evidence", "_archive",
    "code-corpus", "lang-check", "outputs", "logs",
}

FENCE = re.compile(r"```[A-Za-z0-9_+#.-]*\n(.*?)```", re.S)

def run(cmd, timeout=8):
    try:
        r = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
        )
        msg = (r.stderr or r.stdout).strip().splitlines()
        return r.returncode == 0, (msg[0][:140] if msg else "")
    except Exception as e:
        return False, str(e)[:140]

def tmpfile(text, suffix):
    p = os.path.join(
        tempfile.gettempdir(),
        "khoem_lc_" + hashlib.sha256(text.encode("utf-8", "ignore")).hexdigest()[:16] + suffix
    )
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)
    return p

def chk_python(text):
    try:
        ast.parse(text)
        return True, ""
    except SyntaxError as e:
        return False, f"line {e.lineno}: {e.msg}"

def chk_json(text):
    try:
        json.loads(text)
        return True, ""
    except Exception as e:
        return False, str(e)[:140]

def chk_javascript(text):
    node = shutil.which("node")
    if not node:
        return None
    p = tmpfile(text, ".js")
    return run([node, "--check", p])

def chk_shell(text):
    bash = shutil.which("bash")
    if not bash:
        return None
    p = tmpfile(text, ".sh")
    return run([bash, "-n", p])

CHECKERS = {
    "python": chk_python,
    "json": chk_json,
    "javascript": chk_javascript,
    "shell": chk_shell,
}

def stat():
    return {"found": 0, "pass": 0, "fail": 0, "skip": 0}

repo = collections.defaultdict(stat)
dataset = collections.defaultdict(stat)
failures = []

# ============================================================
# 1. REAL REPOSITORY FILES
# ============================================================

for d, dirs, files in os.walk(ROOT):
    dirs[:] = [
        x for x in dirs
        if x not in SKIP_DIRS and not x.startswith("_merge_backup")
    ]

    for name in files:
        if ".bak" in name or name.endswith(".min.js"):
            continue

        ext = os.path.splitext(name)[1].lower()
        lang = EXT.get(ext)
        if not lang:
            continue

        path = os.path.join(d, name)
        s = repo[lang]
        s["found"] += 1

        try:
            if os.path.getsize(path) > 3_000_000:
                s["skip"] += 1
                continue

            text = open(
                path,
                encoding="utf-8",
                errors="replace"
            ).read()
        except Exception:
            s["skip"] += 1
            continue

        checker = CHECKERS.get(lang)

        # Languages without a safe local checker are reported,
        # not treated as failures.
        if checker is None:
            s["skip"] += 1
            continue

        if s["pass"] + s["fail"] >= N:
            s["skip"] += 1
            continue
        result = checker(text)

        if result is None:
            s["skip"] += 1
        elif result[0]:
            s["pass"] += 1
        else:
            s["fail"] += 1
            failures.append(
                f"REPO {lang} {os.path.relpath(path, ROOT)} :: {result[1]}"
            )

# ============================================================
# 2. DATASET CODE SNIPPETS
# ============================================================

for split in ("train", "valid"):
    fp = os.path.join(DATA, split + ".jsonl")
    if not os.path.exists(fp):
        continue

    try:
        fh = open(fp, encoding="utf-8")
    except Exception:
        continue

    for line in fh:
        line = line.strip()
        if not line:
            continue

        try:
            row = json.loads(line)
        except Exception:
            continue

        answer = next(
            (
                m.get("content", "")
                for m in row.get("messages", [])
                if m.get("role") == "assistant"
            ),
            "",
        )

        match = FENCE.search(answer)
        if not match:
            continue

        lang = row.get("lang", "?")
        code = match.group(1)
        dataset[lang]["found"] += 1

    fh.close()

# ============================================================
# REPORT
# ============================================================

def print_table(title, data):
    print()
    print("== " + title + " ==")
    print(f"{'language':<12}{'found':>8}{'pass':>8}{'fail':>8}{'skip':>8}")

    for lang, s in sorted(
        data.items(),
        key=lambda x: -x[1]["found"]
    ):
        print(
            f"{lang:<12}"
            f"{s['found']:>8}"
            f"{s['pass']:>8}"
            f"{s['fail']:>8}"
            f"{s['skip']:>8}"
        )

print("KHOEM_AI language check")
print("root:", ROOT)
print("dataset:", DATA)
print("NOTE: source code is NEVER executed.")

print_table("Repository files", repo)
print_table("Dataset snippets", dataset)

os.makedirs(OUT, exist_ok=True)

with open(
    os.path.join(OUT, "failures.txt"),
    "w",
    encoding="utf-8"
) as f:
    f.write("\n".join(failures) + "\n")

with open(
    os.path.join(OUT, "report.json"),
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        {
            "root": ROOT,
            "repo": repo,
            "dataset": dataset,
            "failures": failures,
        },
        f,
        ensure_ascii=False,
        indent=2,
    )

print()
print("failures:", len(failures))
print("report:", os.path.join(OUT, "report.json"))
print("details:", os.path.join(OUT, "failures.txt"))
