import json
from pathlib import Path

def test_config():
    p=Path(__file__).resolve().parents[1]/'config.json'; d=json.loads(p.read_text())
    assert d['lora_rank']==8 and d['max_seq_length']==2048


import ast, re, warnings
ROOT = Path(__file__).resolve().parents[1]

def _cells():
    d = json.loads((ROOT / 'notebooks' / 'khoem_lora.ipynb').read_text(encoding='utf-8'))
    return ["".join(c['source']) for c in d['cells'] if c['cell_type'] == 'code']

def _num(s, name):
    return float(re.search(r"^" + name + r"\s*=\s*([0-9.e-]+)", s, re.M).group(1))

def test_notebook_matches_config():
    d = json.loads((ROOT / 'config.json').read_text(encoding='utf-8'))
    s = next(c for c in _cells() if 'MAX_TRAIN_ROWS' in c)
    assert re.search(r'^MODEL\s*=\s*"([^"]+)"', s, re.M).group(1) == d['model_name']
    assert _num(s, 'LR') == d['learning_rate'] and _num(s, 'RANK') == d['lora_rank']
    assert d['lora_alpha'] == 2 * d['lora_rank'] and _num(s, 'MAX_SEQ') == d['max_seq_length'] and _num(s, 'EPOCHS') == d['epochs']

def test_notebook_rules():
    warnings.simplefilter('ignore')
    c = _cells(); a = "\n".join(c)
    assert 'FORCE_SAVE' not in a and 'min(600' not in a
    assert a.count('get_peft_model(') == 1 and 'assert SAVE_OK' in a and 'before - 0.03' in a
    assert a.index('before = run_eval') < a.index('get_peft_model(') < a.index('trainer.train()') < a.index('after = run_eval')
    for s in c:
        ast.parse("\n".join(l for l in s.splitlines() if not l.lstrip().startswith(('!', '%'))))

def test_data():
    warnings.simplefilter('ignore')
    sets = {}
    for n in ('train', 'valid'):
        p = ROOT / 'data' / (n + '.jsonl')
        if not p.exists():
            return
        rows = [json.loads(l) for l in p.open(encoding='utf-8') if l.strip()]
        assert rows and all(len(x['messages']) >= 2 and x['messages'][0]['role'] == 'user' and x['messages'][-1]['role'] == 'assistant' for x in rows)
        for x in rows:
            if x.get('lang') == 'python':
                ast.parse(re.search(r"```python\n(.*?)```", x['messages'][-1]['content'], re.S).group(1))
        sets[n] = {x['messages'][-1]['content'] for x in rows}
    assert not (sets['train'] & sets['valid'])


def test_eval_plan():
    c = _cells(); a = "\\n".join(c)
    s = next(x for x in c if 'MAX_TRAIN_ROWS' in x)
    assert _num(s, 'N_EVAL') == 164
    mix = ast.literal_eval(re.search(r"^SMOKE_MIX\s*=\s*(\{[^}]*\})", s, re.M).group(1))
    assert sum(mix.values()) == 100
    assert 'def test_loss' in a and 'if SMOKE:' in a and 'assert SAVE_OK' in a
    train_cell = next(x for x in c if 'trainer.train()' in x)
    assert 'test.jsonl' not in train_cell
