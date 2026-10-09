import os, re, subprocess, sys, tempfile
from pathlib import Path
from unsloth import FastLanguageModel  # ត្រូវ import មុន trl
import torch, inspect
from datasets import load_dataset
from trl import SFTTrainer, SFTConfig
from config import load

def extract(t):
    m = re.findall(r"```(?:python)?\n(.*?)```", t, flags=re.S)
    return m[0] if m else t

def run_eval(model, tok, n):
    he = load_dataset("openai/openai_humaneval", split="test").select(range(n))
    FastLanguageModel.for_inference(model)
    ok = 0
    for ex in he:
        msgs = [{"role": "user", "content": "Complete this Python function. Return the full function in one ```python block.\n\n" + ex["prompt"]}]
        ids = tok.apply_chat_template(msgs, add_generation_prompt=True, return_tensors="pt").to("cuda")
        with torch.no_grad():
            out = model.generate(input_ids=ids, max_new_tokens=512, do_sample=False)
        reply = tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True)
        imps = "\n".join(l for l in ex["prompt"].splitlines() if l.startswith(("import ", "from ")))
        prog = imps + "\n" + extract(reply) + "\n\n" + ex["test"] + f"\ncheck({ex['entry_point']})\n"
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
            f.write(prog); p = f.name
        try:
            r_ = subprocess.run([sys.executable, p], capture_output=True, timeout=10); ok += r_.returncode == 0
            if r_.returncode != 0: open("he_fail.txt", "a", encoding="utf-8").write("### " + ex["entry_point"] + "\n" + reply + "\n--- ERR ---\n" + r_.stderr.decode()[-300:] + "\n\n")
        except subprocess.TimeoutExpired:
            pass
        os.unlink(p)
    return ok / n

import eval_khmer_code as KE

def run_khmer_eval(model, tok):
    FastLanguageModel.for_inference(model)
    ok = 0
    cache = {}
    for prompt, name, test in KE.TASKS:
        if prompt not in cache:
            ids = tok.apply_chat_template([{"role": "user", "content": prompt}], add_generation_prompt=True, return_tensors="pt").to("cuda")
            with torch.no_grad():
                out = model.generate(input_ids=ids, max_new_tokens=400, do_sample=False)
            cache[prompt] = KE.extract(tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True))
        ok += KE.run_test(cache[prompt], test)
    return ok / len(KE.TASKS)

cfg = load()
N = int(os.environ.get("N_EVAL", 164))
STEPS = int(os.environ.get("MAX_STEPS", 3300))  # ~1 epoch of 26.8K rows at effective batch 8
model, tok = FastLanguageModel.from_pretrained(model_name=cfg["model_name"], max_seq_length=cfg["max_seq_length"], load_in_4bit=cfg["load_in_4bit"])
before = run_eval(model, tok, N); print(f"HumanEval មុន: {before:.3f}")
kb = run_khmer_eval(model, tok); print(f"Khmer-code មុន: {kb:.3f}")
model = FastLanguageModel.get_peft_model(model, r=cfg["lora_rank"], lora_alpha=cfg["lora_alpha"], lora_dropout=cfg["lora_dropout"], target_modules=cfg["target_modules"], use_gradient_checkpointing=cfg["gradient_checkpointing"], random_state=cfg["random_state"])
FastLanguageModel.for_training(model)
fmt = lambda ex: {"text": tok.apply_chat_template(ex["messages"], tokenize=False)}
train = load_dataset("json", data_files="data_clean/final_train_v6.jsonl", split="train").map(fmt)
valid = load_dataset("json", data_files="data_clean/final_valid_v5b.jsonl", split="train").map(fmt)
sig = inspect.signature(SFTConfig.__init__).parameters
P = dict(output_dir=cfg["output_dir"], per_device_train_batch_size=cfg["batch_size"], per_device_eval_batch_size=2, gradient_accumulation_steps=cfg["gradient_accumulation_steps"], max_steps=STEPS, seed=cfg["random_state"], fp16=not torch.cuda.is_bf16_supported(), bf16=torch.cuda.is_bf16_supported(), learning_rate=min(cfg["learning_rate"],5e-5), warmup_steps=cfg["warmup_steps"], logging_steps=10, report_to="none", dataset_text_field="text", optim=cfg["optimizer"])
P["eval_strategy" if "eval_strategy" in sig else "evaluation_strategy"] = "no"
P["max_length" if "max_length" in sig else "max_seq_length"] = cfg["max_seq_length"]
P.update(save_strategy="steps", save_steps=500, save_total_limit=2)
K = dict(model=model, train_dataset=train, eval_dataset=valid, args=SFTConfig(**P))
K["processing_class" if "processing_class" in inspect.signature(SFTTrainer.__init__).parameters else "tokenizer"] = tok
trainer = SFTTrainer(**K)
from unsloth.chat_templates import train_on_responses_only
trainer = train_on_responses_only(trainer, instruction_part="<|im_start|>user\n", response_part="<|im_start|>assistant\n")
test = load_dataset("json", data_files="data_clean/final_test_v5b.jsonl", split="train").map(fmt)
tl0 = trainer.evaluate(eval_dataset=test)["eval_loss"]; print(f"Test loss មុន: {tl0:.4f}")
ck = sorted(Path(cfg["output_dir"]).glob("checkpoint-*"), key=lambda d: int(d.name.split("-")[-1]))
trainer.train(resume_from_checkpoint=str(ck[-1]) if ck else None)
uv = Path(cfg["output_dir"]) / "adapter_unvetted"; uv.mkdir(parents=True, exist_ok=True)
model.save_pretrained(uv); tok.save_pretrained(uv)
tl1 = trainer.evaluate(eval_dataset=test)["eval_loss"]; print(f"Test loss ក្រោយ: {tl1:.4f} (មុន {tl0:.4f})")
after = run_eval(model, tok, N)
print(f"HumanEval មុន: {before:.3f} → ក្រោយ: {after:.3f}")
ka = run_khmer_eval(model, tok); print(f"Khmer-code ក្រោយ: {ka:.3f} (មុន {kb:.3f})")
if after < before - 0.03: sys.exit("HumanEval ធ្លាក់ច្រើន: មិនរក្សាទុក adapter")
PER = len(KE.TASKS) // len({t[0] for t in KE.TASKS})
if round((kb - ka) * len(KE.TASKS)) > PER: sys.exit(f"Khmer-code ធ្លាក់លើស 1 prompt ({PER} tasks): មិនរក្សាទុក adapter")
if tl1 >= tl0: sys.exit("Test loss មិនប្រសើរ: មិនរក្សាទុក adapter")
out = Path(cfg["output_dir"]) / "adapter"; out.mkdir(parents=True, exist_ok=True)
model.save_pretrained(out); tok.save_pretrained(out)
