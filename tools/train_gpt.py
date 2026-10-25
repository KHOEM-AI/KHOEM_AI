import numpy as np, torch, torch.nn.functional as F, time, os, math
from khoem_gpt import GPT
E = lambda k, d: type(d)(os.environ.get(k, d))
torch.set_num_threads(E("THREADS", 6))
V, T = 16000, 128
D, L, H, B = E("D", 128), E("L", 4), E("H", 4), E("B", 16)
MAX_TOKENS, LR, SAVE_MIN = E("MAX_TOKENS", 4000000), E("LR", 2e-3), E("SAVE_MIN", 10)
home = os.path.expanduser("~/KHOEM_AI")
tr = np.memmap(f"{home}/khoem75m_data/train.bin", dtype=np.uint16, mode="r")
va = np.memmap(f"{home}/khoem75m_data/val.bin", dtype=np.uint16, mode="r")
def batch(d, rng):
    ix = rng.integers(0, len(d)-T-1, B)
    x = np.stack([d[i:i+T] for i in ix]).astype(np.int64)
    y = np.stack([d[i+1:i+T+1] for i in ix]).astype(np.int64)
    return torch.from_numpy(x), torch.from_numpy(y)
cfg = dict(V=V, T=T, D=D, L=L, H=H)
m = GPT(**cfg)
print("params:", round(sum(p.numel() for p in m.parameters())/1e6, 2), "M", flush=True)
opt = torch.optim.AdamW(m.parameters(), lr=LR, betas=(0.9, 0.95), weight_decay=0.1)
ck = f"{home}/ckpt_d{D}l{L}.pt"
step = 0
if os.path.exists(ck):
    s = torch.load(ck)
    assert s["cfg"] == cfg, "config differs from checkpoint"
    m.load_state_dict(s["model"]); opt.load_state_dict(s["opt"]); step = s["step"]
    print("resumed at step", step, flush=True)
TOTAL = MAX_TOKENS // (B*T)
def lr_at(i):
    if i < 100:
        return LR*(i+1)/100
    p = min(1.0, (i-100)/max(1, TOTAL-100))
    return LR*(0.1 + 0.45*(1+math.cos(math.pi*p)))
@torch.no_grad()
def val_loss():
    m.eval(); rng = np.random.default_rng(0); t = 0
    for _ in range(20):
        x, y = batch(va, rng)
        t += F.cross_entropy(m(x).view(-1, V), y.view(-1)).item()
    m.train()
    return t/20
def save():
    torch.save(dict(model=m.state_dict(), opt=opt.state_dict(), step=step, cfg=cfg), ck+".tmp")
    os.replace(ck+".tmp", ck)
rng = np.random.default_rng(int(time.time()))
t0 = last = time.time(); s0 = step
while step < TOTAL:
    for g in opt.param_groups:
        g["lr"] = lr_at(step)
    x, y = batch(tr, rng)
    loss = F.cross_entropy(m(x).view(-1, V), y.view(-1))
    opt.zero_grad(); loss.backward()
    torch.nn.utils.clip_grad_norm_(m.parameters(), 1.0)
    opt.step(); step += 1
    if step % 20 == 0:
        tps = (step-s0)*B*T/(time.time()-t0)
        print(f"step {step}/{TOTAL} loss {loss.item():.3f} tok/s {tps:.0f} eta {(TOTAL-step)*B*T/tps/3600:.1f}h", flush=True)
    if time.time()-last > SAVE_MIN*60:
        save(); print(f"== saved, val loss {val_loss():.3f}", flush=True); last = time.time()
save(); print(f"== FINAL val loss {val_loss():.3f}", flush=True)
