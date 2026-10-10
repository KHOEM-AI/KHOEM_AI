import json, re, random, hashlib, sys
random.seed(3407)
F = chr(96) * 3
label = sys.argv[1]
names = {'typescript': 'TypeScript', 'javascript': 'JavaScript'}
src = [json.loads(l) for l in open('../code-corpus/' + label + '.jsonl', encoding='utf-8') if l.strip()]
pat = re.compile(r'/\*\*((?:(?!\*/).)*)\*/\s*((?:export\s+)?(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?(?=\()))', re.S)
def match(t, i, o, c):
    d = 0
    for j in range(i, len(t)):
        if t[j] == o: d += 1
        elif t[j] == c:
            d -= 1
            if d == 0: return j
    return -1
out, seen = [], set()
for r in src:
    lg = r['lang']
    if lg not in names: continue
    nm = names[lg]
    t = r['text']
    for m in pat.finditer(t):
        doc = re.sub(r'^\s*\*\s?', '', m.group(1), flags=re.M).strip()
        doc = doc.split('\n\n')[0].replace('\n', ' ')
        doc = re.split(r'\s@\w+', doc)[0].strip()
        if len(doc) < 25 or doc.startswith('@'): continue
        is_const = re.search(r'\bconst\b', m.group(2)) is not None
        p = t.find('(', m.end(2))
        if p < 0: continue
        q = match(t, p, '(', ')')
        if q < 0: continue
        b = t.find('{', q)
        if b < 0: continue
        gap = t[q:b]
        if ';' in gap: continue
        if is_const and '=>' not in gap: continue
        e = match(t, b, '{', '}')
        if e < 0: continue
        code = t[m.start(2):e + 1]
        if code.count('\n') < 2 or len(code) > 3000: continue
        h = hashlib.sha256(code.encode()).hexdigest()
        if h in seen: continue
        seen.add(h)
        a = F + lg + '\n' + code + '\n' + F
        kh = random.choice(['សរសេរ ' + nm + ' function ដែល', 'សូមសរសេរ function ជា ' + nm + ' ដើម្បី'])
        for pr in (kh + ': ' + doc, 'Write a ' + nm + ' function that: ' + doc):
            out.append({'lang': lg, 'messages': [{'role': 'user', 'content': pr}, {'role': 'assistant', 'content': a}]})
        out.append({'lang': lg, 'messages': [{'role': 'user', 'content': 'Write a JSDoc comment for this function:\n' + F + lg + '\n' + code + '\n' + F}, {'role': 'assistant', 'content': F + lg + '\n/** ' + doc + ' */\n' + code + '\n' + F}]})
fn = 'data/instruct_' + label + '.jsonl'
with open(fn, 'w', encoding='utf-8') as f:
    for x in out: f.write(json.dumps(x, ensure_ascii=False) + '\n')
print('pairs:', len(out), 'functions:', len(out) // 3)
