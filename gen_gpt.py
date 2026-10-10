import torch, sentencepiece as spm, os, sys
from khoem_gpt import GPT
home = os.path.expanduser("~/KHOEM_AI")
D, L = int(os.environ.get("D", 128)), int(os.environ.get("L", 4))
s = torch.load(f"{home}/ckpt_d{D}l{L}.pt")
m = GPT(**s["cfg"]); m.load_state_dict(s["model"]); m.eval()
sp = spm.SentencePieceProcessor(model_file=f"{home}/khoem_bpe16k.model")
ids = sp.encode(sys.argv[1] if len(sys.argv) > 1 else "ប្រទេសកម្ពុជា")
T = s["cfg"]["T"]
with torch.no_grad():
    for _ in range(80):
        lg = m(torch.tensor([ids[-T:]]))[0, -1] / 0.8
        v, ix = torch.topk(lg, 40)
        ids.append(ix[torch.multinomial(torch.softmax(v, -1), 1)].item())
        if ids[-1] == sp.eos_id():
            break
print(sp.decode(ids))
