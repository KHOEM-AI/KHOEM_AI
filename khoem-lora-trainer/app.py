import tkinter as tk
from tkinter import messagebox
from pathlib import Path
import json, sys, importlib.util, threading

APP_DIR = Path(__file__).resolve().parent
CONFIG = APP_DIR / 'config.json'

def load_config():
    return json.loads(CONFIG.read_text(encoding='utf-8'))

def check_environment():
    results = [f'Python: {sys.version.split()[0]}']
    for pkg in ['torch','transformers','datasets','trl','unsloth']:
        results.append(f"{pkg}: {'OK' if importlib.util.find_spec(pkg) else 'MISSING'}")
    try:
        import torch
        results.append(f"CUDA: {'OK' if torch.cuda.is_available() else 'NOT AVAILABLE'}")
        if torch.cuda.is_available():
            results.append(f'GPU: {torch.cuda.get_device_name(0)}')
            results.append(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    except Exception as e:
        results.append(f'PyTorch check: ERROR: {e}')
    return '\n'.join(results)

def validate_jsonl(path):
    p = Path(path)
    if not p.exists(): return False, f'Missing: {p}'
    count = 0
    for n, line in enumerate(p.open(encoding='utf-8'), 1):
        if not line.strip(): continue
        try: obj = json.loads(line)
        except Exception as e: return False, f'{p.name} line {n}: invalid JSON: {e}'
        if not isinstance(obj.get('messages'), list) or len(obj['messages']) < 2:
            return False, f'{p.name} line {n}: messages must contain at least 2 items'
        roles = {m.get('role') for m in obj['messages'] if isinstance(m, dict)}
        if not {'user','assistant'} <= roles:
            return False, f'{p.name} line {n}: user/assistant messages required'
        count += 1
    return True, f'{p.name}: OK ({count:,} examples)'

class App(tk.Tk):
    def __init__(self):
        super().__init__(); self.title('KHOEM LoRA Trainer'); self.geometry('760x620')
        self.cfg = load_config()
        self.text = tk.Text(self, height=25, wrap='word'); self.text.pack(fill='both', expand=True, padx=12, pady=12)
        bar = tk.Frame(self); bar.pack(fill='x', padx=12, pady=(0,12))
        for label, fn in [('Check Environment', self.environment), ('Check Dataset', self.dataset), ('Start Training', self.start_training)]:
            tk.Button(bar, text=label, command=fn).pack(side='left', padx=4)
        self.write('KHOEM LoRA Trainer'); self.write('Ready. Training is not started automatically.')
    def write(self, s): self.text.insert('end', s+'\n'); self.text.see('end'); self.update_idletasks()
    def environment(self): self.write('\n[Environment]\n'+check_environment())
    def dataset(self):
        self.write('\n[Dataset]')
        for name in ['final_train.jsonl','final_valid.jsonl']:
            ok,msg=validate_jsonl(APP_DIR/'data_clean'/name); self.write(msg)
    def start_training(self):
        if messagebox.askyesno('Confirm training','Start LoRA training now?'):
            threading.Thread(target=self._train, daemon=True).start()
    def _train(self):
        try:
            from train import run_training
            run_training(APP_DIR/'data_clean'/'final_train.jsonl', APP_DIR/'data_clean'/'final_valid.jsonl', self.cfg, self.write)
        except Exception as e: self.write(f'TRAINING ERROR: {type(e).__name__}: {e}')

if __name__ == '__main__': App().mainloop()
