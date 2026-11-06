# KHOEM LoRA Trainer

Python-first application for the KHOEM code LoRA workflow.

## Included
- `app.py` — GUI entry point
- `train.py` — LoRA/SFT training engine with TRL API compatibility checks
- `config.json` — fixed initial training configuration
- `requirements.txt` — GPU environment dependencies
- `data/train.jsonl` and `data/valid.jsonl` — put the existing datasets here
- `outputs/` — adapter output
- `logs/` — reserved for logs
- `tests/` — reserved for tests

## First use
1. Put the existing `train.jsonl` and `valid.jsonl` into `data/`.
2. Install `requirements.txt` on the GPU machine.
3. Start `app.py`.
4. Click **Check Environment**.
5. Click **Check Dataset**.
6. Click **Start Training** only when both checks are OK.

The program never starts training automatically.

## Important
The application source is Python. JSONL is kept as the dataset format and JSON is kept as the configuration format. The trainer still requires a compatible GPU environment for the 7B 4-bit workload.

## Notebook (Kaggle / Colab)
`notebooks/khoem_lora.ipynb` is the main workflow: HumanEval baseline, then LoRA, training, HumanEval again, and the adapter is saved only if the score did not drop by more than 0.03. `run_colab.py` has the same save rule. `train.py` / `app.py` have no HumanEval gate. If LoRA was already applied (or after a Restart), run the notebook again from the first cell.
Datasets are built by `tools/make-pairs.mjs` from `code-corpus/`; `data/*.jsonl` are local copies and are not tracked by git.
