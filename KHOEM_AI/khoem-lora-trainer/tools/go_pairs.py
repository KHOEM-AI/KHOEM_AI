import json, random, hashlib, sys
random.seed(3407)
F = chr(96) * 3
label = sys.argv[1]
src = [json.loads(l) for l in open('../code-corpus/' + label + '.jsonl', encoding='utf-8') if l.strip()]
out, seen = [], set()
for r in src:
    if r['lang'] != 'go':
        continue
    L = r['text'].split('\n')
    for i in range(1, len(L)):
        if not L[i].startswith('func ') or not L[i - 1].startswith('//'):
            continue
        cm = []
        j = i - 1
        while j >= 0 and L[j].startswith('//'):
            cm.append(L[j])
            j -= 1
        cm.reverse()
        if any(c.startswith('//go:') or c.startswith('//nolint') or c.startswith('//export') for c in cm):
            continue
        s = i
        while not L[s].rstrip().endswith('{'):
            s += 1
            if s >= len(L) or s - i > 8 or not (L[s].startswith('\t') or L[s].startswith(')')):
                s = -1
                break
        if s < 0:
            continue
        k = s + 1
        while k < len(L) and L[k] != '}':
            if L[k].startswith('func '):
                k = -1
                break
            k += 1
        if k < 0 or k >= len(L):
            continue
        code = '\n'.join(L[i:k + 1])
        if code.count('\n') < 2 or len(code) > 3000 or code.count('{') != code.count('}'):
            continue
        block = '\n'.join(cm)
        txt = [c[3:] if c.startswith('// ') else '' for c in cm]
        doc = '\n'.join(txt).strip().split('\n\n')[0].replace('\n', ' ').strip()
        if len(doc) < 25 or doc.startswith('Deprecated'):
            continue
        if F in code or F in block or F in doc:
            continue
        h = hashlib.sha256(code.encode()).hexdigest()
        if h in seen:
            continue
        seen.add(h)
        a = F + 'go\n' + code + '\n' + F
        kh = random.choice(['សរសេរ Go function ដែល', 'សូមសរសេរ function ជា Go ដើម្បី'])
        for pr in (kh + ': ' + doc, 'Write a Go function that: ' + doc):
            out.append({'lang': 'go', 'messages': [{'role': 'user', 'content': pr}, {'role': 'assistant', 'content': a}]})
        out.append({'lang': 'go', 'messages': [{'role': 'user', 'content': 'Write a Go doc comment for this function:\n' + F + 'go\n' + code + '\n' + F}, {'role': 'assistant', 'content': F + 'go\n' + block + '\n' + code + '\n' + F}]})
fn = 'data/instruct_go_' + label + '.jsonl'
with open(fn, 'w', encoding='utf-8') as f:
    for x in out:
        f.write(json.dumps(x, ensure_ascii=False) + '\n')
print('pairs:', len(out), 'functions:', len(out) // 3)
