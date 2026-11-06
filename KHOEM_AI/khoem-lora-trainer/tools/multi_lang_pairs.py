#!/usr/bin/env python3
import json, os, re, sys, random, hashlib, textwrap
from collections import Counter

random.seed(3407)
ROOT = "../code-corpus"
MAXF = int(sys.argv[1]) if len(sys.argv) > 1 else 600
PER_FILE = 8
TICKS = "`" * 3
PRE = r"(?m)^[ \t]*"

CFG = {
    "php": {"ext": {".php"}, "decl": re.compile(PRE +
        r"(?:(?:public|protected|private|static|final|abstract)\s+)*function\s+&?[A-Za-z_]\w*\s*\(")},
    "swift": {"ext": {".swift"}, "decl": re.compile(PRE +
        r"(?:(?:@\w+(?:\([^)\n]*\))?|public|private|internal|fileprivate|open|package|static|class|final|mutating|nonmutating|override|convenience|required|nonisolated)\s+)*func\s+[\w`]+\s*(?:<[^>\n]*>)?\s*\(")},
    "kotlin": {"ext": {".kt", ".kts"}, "decl": re.compile(PRE +
        r"(?:(?:public|private|protected|internal|inline|infix|operator|suspend|tailrec|override|open|final|abstract|actual|external)\s+)*fun\s+(?:<[^>\n]*>\s*)?(?:[\w<>?,.]+\.)?[A-Za-z_]\w*\s*\(")},
    "dart": {"ext": {".dart"}, "decl": re.compile(PRE +
        r"(?:(?:static|external)\s+)?(?:void|bool|int|double|num|dynamic|var|[A-Z]\w*(?:<[^\n(){};]*>)?\??)\s+[a-z_]\w*\s*(?:<[^\n(){};]*>)?\s*\(")},
}
NAME = {"php": "PHP", "swift": "Swift", "kotlin": "Kotlin", "dart": "Dart"}

SKIP_PATH = re.compile(r"(^|/)(tests?|Tests?|spec|__tests__|examples?|vendor|Benchmarks?|integration_test|build|\.build|node_modules)(/|$)")
BAD_DOC = re.compile(r"copyright|licen[cs]|spdx|all rights reserved|todo|fixme|deprecated|generated", re.I)
COPYLEFT = re.compile(r"\b(AGPL|LGPL|GPL|GNU General Public|GNU Lesser)", re.I)
GAPBAD = re.compile(r"\b(func|fun|function|class|struct|enum|var|let|val|import)\b")
ANN = re.compile(r"^\s*(@\w[\w.]*(\(.*\))?|#\[.*\])\s*$")
TAG = re.compile(r"^(@\w+|-\s*(Parameter|Parameters|Returns|Throws|Note|Warning|Important|Precondition|Complexity)\b|#+\s|\{@|\x60{3})")

def classify(text):
    h = "\n".join(text.splitlines()[:40])
    if COPYLEFT.search(h): return "copyleft"
    if re.search(r"apache", h, re.I): return "apache"
    if re.search(r"\bMIT\b|permission is hereby granted", h, re.I): return "mit"
    if re.search(r"\bBSD\b", h): return "bsd"
    return "no-header"

def summarize(raw):
    out = []
    for ln in raw:
        s = ln.strip()
        if not s:
            if out: break
            continue
        if TAG.match(s): break
        out.append(s)
    t = " ".join(out)
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
    t = re.sub(r"\{@\w+\s+([^}]*)\}", r"\1", t)
    t = t.replace("`", "")
    t = re.sub(r"\s+", " ", t).strip()
    if not (25 <= len(t) <= 300) or len(t.split()) < 4: return ""
    if BAD_DOC.search(t): return ""
    if sum(c.isascii() for c in t) / len(t) < 0.9: return ""
    return t

def find_doc(text, start):
    ls = text.rfind("\n", 0, start) + 1
    lines = text[max(0, ls - 8000):ls].split("\n")
    if lines and lines[-1] == "": lines.pop()
    i = len(lines) - 1
    while i >= 0 and ANN.match(lines[i]): i -= 1
    if i < 0: return ""
    last = lines[i].strip()
    if last.startswith("///"):
        j = i
        while j >= 0 and lines[j].strip().startswith("///"): j -= 1
        raw = [re.sub(r"^\s*///\s?", "", l) for l in lines[j + 1:i + 1]]
        return summarize(raw)
    if last.endswith("*/"):
        j = i
        while j >= 0 and "/**" not in lines[j]:
            if j != i and "*/" in lines[j]: return ""
            j -= 1
            if i - j > 60: return ""
        if j < 0: return ""
        raw = []
        for l in lines[j:i + 1]:
            l = re.sub(r"^\s*/\*\*+\s?", "", l)
            l = re.sub(r"\s*\*+/\s*$", "", l)
            l = re.sub(r"^\s*\*\s?", "", l)
            raw.append(l)
        return summarize(raw)
    return ""

def match_paren(text, i):
    d = 0
    for k in range(i, min(len(text), i + 2500)):
        c = text[k]
        if c == "(": d += 1
        elif c == ")":
            d -= 1
            if d == 0: return k
    return -1

def match_brace(text, start):
    depth, quote, esc, lc, bc, i = 0, None, False, False, False, start
    while i < len(text):
        c = text[i]; n = text[i + 1] if i + 1 < len(text) else ""
        if lc:
            if c == "\n": lc = False
        elif bc:
            if c == "*" and n == "/": bc = False; i += 1
        elif quote:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == quote: quote = None
        elif c == "/" and n == "/": lc = True; i += 1
        elif c == "/" and n == "*": bc = True; i += 1
        elif c in "\"'`": quote = c
        elif c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0: return i
        i += 1
    return -1

def extract_body(text, m):
    close = match_paren(text, m.end() - 1)
    if close < 0: return None
    seg = text[close + 1:close + 401]
    mm = re.search(r"[{;]|=>", seg)
    if not mm or mm.group() != "{": return None
    gap = seg[:mm.start()]
    if "\n\n" in gap or GAPBAD.search(gap) or re.search(r"(?<![=!<>])=(?!=)", gap): return None
    end = match_brace(text, close + 1 + mm.start())
    if end < 0: return None
    code = textwrap.dedent(text[m.start():end + 1]).strip("\n")
    if not (120 <= len(code) <= 4000) or code.count("\n") < 3: return None
    return code

def collect(lang):
    cfg, fun, cands = CFG[lang], Counter(), []
    seen_code, seen_doc = set(), Counter()
    with open(os.path.join(ROOT, lang + ".jsonl"), encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            r = json.loads(line)
            path = r.get("path", "")
            if r.get("lang") != lang or os.path.splitext(path)[1].lower() not in cfg["ext"]: continue
            if SKIP_PATH.search(path): fun["skip_path"] += 1; continue
            text = r.get("text", "")
            lic = classify(text)
            if lic == "copyleft": fun["skip_copyleft"] += 1; continue
            fun["files"] += 1
            for m in cfg["decl"].finditer(text):
                fun["decl"] += 1
                doc = find_doc(text, m.start())
                if not doc: continue
                fun["with_doc"] += 1
                code = extract_body(text, m)
                if not code: continue
                fun["with_body"] += 1
                h = hashlib.sha256(code.encode()).hexdigest()
                if h in seen_code or seen_doc[doc.lower()] >= 2: continue
                seen_code.add(h); seen_doc[doc.lower()] += 1
                cands.append((path, doc, code, lic))
    return cands, fun

def rows_for(lang, path, doc, code):
    nm = NAME[lang]
    fenced = TICKS + lang + "\n" + code + "\n" + TICKS
    cm = "/// " + doc if lang in ("swift", "dart") else "/** " + doc + " */"
    def row(u, a): return {"lang": lang, "path": path,
        "messages": [{"role": "user", "content": u}, {"role": "assistant", "content": a}]}
    return [
        row("សរសេរ " + nm + " function តាមការពិពណ៌នានេះ៖ " + doc, fenced),
        row("Write a " + nm + " function for this description: " + doc, fenced),
        row("Write a doc comment for this " + nm + " function:\n" + fenced,
            TICKS + lang + "\n" + cm + "\n" + code + "\n" + TICKS),
    ]

os.makedirs("data", exist_ok=True)
for lang in ("php", "swift", "kotlin", "dart"):
    cands, fun = collect(lang)
    random.shuffle(cands)
    per, chosen = Counter(), []
    for c in cands:
        if per[c[0]] >= PER_FILE: continue
        per[c[0]] += 1; chosen.append(c)
        if len(chosen) >= MAXF: break
    out = "data/instruct_%s.jsonl" % lang
    n = 0
    with open(out, "w", encoding="utf-8") as f:
        for path, doc, code, lic in chosen:
            for r in rows_for(lang, path, doc, code):
                f.write(json.dumps(r, ensure_ascii=False) + "\n"); n += 1
    avg = sum(len(c[1]) for c in chosen) // max(1, len(chosen))
    print("\n=== %s ===" % lang)
    print("funnel:", dict(fun))
    print("candidates=%d chosen=%d rows=%d avg_doc=%d -> %s" % (len(cands), len(chosen), n, avg, out))
    print("license headers:", dict(Counter(c[3] for c in chosen)))
    for c in random.sample(chosen, min(2, len(chosen))):
        print("  DOC :", c[1][:160]); print("  CODE:", " | ".join(c[2].splitlines()[:3])[:200])
