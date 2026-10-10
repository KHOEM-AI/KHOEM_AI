import json, random, hashlib, os, re, textwrap

random.seed(3407)
ROOT = "../code-corpus"

CFG = {
    "php":    {"ext": {".php"},        "name": "PHP",    "kw": r"\bfunction\b", "style": "block"},
    "swift":  {"ext": {".swift"},      "name": "Swift",  "kw": r"\bfunc\b",     "style": "line"},
    "kotlin": {"ext": {".kt", ".kts"}, "name": "Kotlin", "kw": r"\bfun\b",      "style": "block"},
    "dart":   {"ext": {".dart"},       "name": "Dart",   "kw": None,            "style": "line"},
}
DART_SKIP = {"class", "enum", "mixin", "extension", "typedef", "abstract", "import", "export",
             "library", "part", "if", "for", "while", "switch", "return", "final", "const", "var", "late"}

BLOCK_DOC = re.compile(r"/\*\*(?:(?!\*/).)*\*/", re.S)
LINE_DOC = re.compile(r"(?:^[ \t]*///[^\n]*\n)+", re.M)
ANN = re.compile(r"(?:[ \t\r\n]*(?:@[\w.]+(?:\([^)\n]*\))?|#\[[^\]\n]*\]))*[ \t\r\n]*")

def clean_doc(raw):
    lines = []
    for ln in raw.splitlines():
        ln = ln.strip()
        ln = re.sub(r"^/\*\*+|\*+/$", "", ln).strip()
        ln = re.sub(r"^///?\s?", "", ln)
        ln = re.sub(r"^\*\s?", "", ln)
        lines.append(ln.strip())
    para = []
    for ln in lines:
        if not ln:
            if para:
                break
            continue
        if ln.startswith("@") or ln.startswith("- "):
            if para:
                break
            continue
        para.append(ln)
    return re.sub(r"\s+", " ", " ".join(para)).strip()

def match_close(text, i, o, c):
    depth = 0
    for j in range(i, min(len(text), i + 3000)):
        ch = text[j]
        if ch == o:
            depth += 1
        elif ch == c:
            depth -= 1
            if depth == 0:
                return j
    return -1

def find_matching_brace(text, start):
    depth = 0
    quote = None
    esc = False
    line_comment = False
    block_comment = False
    i = start
    while i < len(text):
        c = text[i]
        n = text[i + 1] if i + 1 < len(text) else ""
        if line_comment:
            if c == "\n":
                line_comment = False
            i += 1
            continue
        if block_comment:
            if c == "*" and n == "/":
                block_comment = False
                i += 2
                continue
            i += 1
            continue
        if quote:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                quote = None
            i += 1
            continue
        if c == "/" and n == "/":
            line_comment = True
            i += 2
            continue
        if c == "/" and n == "*":
            block_comment = True
            i += 2
            continue
        if c in "\"'`":
            quote = c
            i += 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

def extract(text, cfg):
    kw = re.compile(cfg["kw"]) if cfg["kw"] else None
    docs = [(m.start(), m.end(), m.group(0)) for m in BLOCK_DOC.finditer(text)]
    docs += [(m.start(), m.end(), m.group(0)) for m in LINE_DOC.finditer(text)]
    for s, e, raw in sorted(docs):
        doc = clean_doc(raw)
        if not (20 <= len(doc) <= 400):
            continue
        pos = ANN.match(text, e).end()
        lp = text.find("(", pos, pos + 300)
        if lp < 0:
            continue
        header = text[pos:lp]
        if "\n\n" in header or ";" in header or "{" in header or "=" in header:
            continue
        words = header.split()
        if not words:
            continue
        if kw is None and words[0] in DART_SKIP:
            continue
        if kw is not None and not kw.search(header):
            continue
        rp = match_close(text, lp, "(", ")")
        if rp < 0:
            continue
        brace = text.find("{", rp, rp + 400)
        if brace < 0:
            continue
        seg = text[rp:brace]
        if "=" in seg or ";" in seg or "}" in seg:
            continue
        end = find_matching_brace(text, brace)
        if end < 0:
            continue
        ls = text.rfind("\n", 0, pos) + 1
        start = ls if text[ls:pos].strip() == "" else pos
        code = textwrap.dedent(text[start:end + 1]).strip("\n")
        if not (80 <= len(code) <= 5000):
            continue
        yield code, doc

def wrap_doc(style, doc):
    return "/** " + doc + " */" if style == "block" else "/// " + doc

def main():
    os.makedirs("data", exist_ok=True)
    for lang, cfg in CFG.items():
        n = cfg["name"]
        seen, out, files = set(), [], 0
        with open(os.path.join(ROOT, lang + ".jsonl"), encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                r = json.loads(line)
                path = r.get("path", "")
                if r.get("lang") != lang or os.path.splitext(path)[1].lower() not in cfg["ext"]:
                    continue
                files += 1
                for code, doc in extract(r.get("text", ""), cfg):
                    h = hashlib.sha256(code.encode()).hexdigest()
                    if h in seen:
                        continue
                    seen.add(h)
                    fence = "```" + lang + "\n" + code + "\n```"
                    base = {"lang": lang, "path": path}
                    out.append({**base, "messages": [
                        {"role": "user", "content": "សរសេរ " + n + " function ដែល: " + doc},
                        {"role": "assistant", "content": fence}]})
                    out.append({**base, "messages": [
                        {"role": "user", "content": "Write a " + n + " function that: " + doc},
                        {"role": "assistant", "content": fence}]})
                    out.append({**base, "messages": [
                        {"role": "user", "content": "Write a " + n + " doc comment for this function:\n" + fence},
                        {"role": "assistant", "content": "```" + lang + "\n" + wrap_doc(cfg["style"], doc) + "\n" + code + "\n```"}]})
        dest = "data/instruct_" + lang + ".jsonl"
        with open(dest, "w", encoding="utf-8") as f:
            for r in out:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(f"{lang}: files={files} functions={len(out)//3} pairs={len(out)} -> {dest}")
        if out:
            longest = max(len(o["messages"][0]["content"]) for o in out[::3])
            print("   longest prompt (chars):", longest)
            print("   sample prompt:", out[1]["messages"][0]["content"][:160])
            print("   sample code  :", " | ".join(out[1]["messages"][1]["content"].splitlines()[1:3])[:160])

main()
