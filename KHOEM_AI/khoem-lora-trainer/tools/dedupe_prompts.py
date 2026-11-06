import json, os
from collections import Counter

MAX_SAME = 3
LANGS = ["php", "swift", "kotlin", "dart"]

for lang in LANGS:
    path = f"data/instruct_{lang}.jsonl"
    rows = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()]
    kept, seen = [], Counter()
    dropped = 0
    for i in range(0, len(rows) - 2, 3):
        group = rows[i:i + 3]
        key = group[1]["messages"][0]["content"].strip().lower()
        if seen[key] >= MAX_SAME:
            dropped += 1
            continue
        seen[key] += 1
        kept.extend(group)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        for r in kept:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    os.replace(tmp, path)
    print(f"{lang}: before={len(rows)//3} dropped={dropped} after={len(kept)//3} pairs={len(kept)}")
    top = seen.most_common(3)
    print("   top prompts:", [(k[:50], v) for k, v in top])
