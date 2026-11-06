import json, sys
from pathlib import Path

def check(path):
    ok = bad = 0
    for i, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            msgs = json.loads(line)["messages"]
            assert isinstance(msgs, list) and len(msgs) >= 2
            assert all("role" in m and "content" in m for m in msgs)
            ok += 1
        except Exception as e:
            bad += 1
            if bad <= 5:
                print(f"{path}:{i} កំហុស: {e!r}")
    print(f"{path}: ត្រឹមត្រូវ {ok}, ខុស {bad}")
    return bad == 0

files = sys.argv[1:] or ["data/train.jsonl", "data/valid.jsonl"]
sys.exit(0 if all([check(f) for f in files]) else 1)
