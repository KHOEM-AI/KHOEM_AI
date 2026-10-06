# Build instruction pairs from real Python docstrings (no LLM, no new sources).
import json, ast, random, hashlib
random.seed(3407)
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
rows = load('data_clean/train.jsonl') + load('data_clean/valid.jsonl') + load('data_clean/test.jsonl')
seen, out = set(), []
for r in rows:
    code_msg = r['messages'][-1]['content']
    if not code_msg.lstrip().startswith('```python'): continue
    code = code_msg.strip().removeprefix('```python').removesuffix('```').strip()
    if code in seen: continue
    seen.add(code)
    try: tree = ast.parse(code)
    except SyntaxError: continue
    fn = next((n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))), None)
    if not fn: continue
    doc = ast.get_docstring(fn)
    if not doc or len(doc) < 25: continue
    first = doc.strip().split('\n\n')[0].replace('\n', ' ')[:300]
    body = ast.unparse(fn)                       # docstring removed below
    if fn.body and isinstance(fn.body[0], ast.Expr) and isinstance(getattr(fn.body[0], 'value', None), ast.Constant):
        fn.body = fn.body[1:] or [ast.Pass()]
    stripped = ast.unparse(fn)
    kh = random.choice(['សរសេរ Python function ដែល', 'សូមសរសេរ function ជា Python ដើម្បី'])
    for prompt in (f'{kh}: {first}', f'Write a Python function that: {first}'):
        out.append({'messages': [{'role': 'user', 'content': prompt},
                                 {'role': 'assistant', 'content': f'```python\n{stripped}\n```'}]})
    out.append({'messages': [{'role': 'user', 'content': f'Write a docstring for this function:\n```python\n{stripped}\n```'},
                             {'role': 'assistant', 'content': f'```python\n{body}\n```'}]})
bucket = lambda s: int(hashlib.sha256(s.encode()).hexdigest(), 16) % 100
with open('data_clean/instruct_docstring.jsonl', 'w', encoding='utf-8') as f:
    for r in out: f.write(json.dumps(r, ensure_ascii=False) + '\n')
print('pairs:', len(out), 'from functions:', len(out) // 3)
