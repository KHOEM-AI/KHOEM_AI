import json
F = chr(96) * 3
rows = [json.loads(l) for l in open('data/instruct_go_gin.jsonl', encoding='utf-8') if l.strip()]
assert rows and len(rows) % 3 == 0, 'no rows'
for r in rows:
    a = r['messages'][1]['content']
    assert r['lang'] == 'go' and a.count(F) == 2 and a.startswith(F + 'go\n') and a.endswith('\n}\n' + F), a[:80]
for i in range(0, len(rows), 3):
    c = [r['messages'][1]['content'] for r in rows[i:i + 3]]
    assert c[0] == c[1], 'group mismatch'
print('SANITY OK', len(rows), 'rows', len(rows) // 3, 'functions')
print(rows[0]['messages'][0]['content'][:200])
print(rows[0]['messages'][1]['content'][:400])
