import torch, torch.nn as nn, torch.nn.functional as F

class Block(nn.Module):
    def __init__(s, D, H):
        super().__init__()
        s.H = H
        s.ln1 = nn.LayerNorm(D); s.ln2 = nn.LayerNorm(D)
        s.qkv = nn.Linear(D, 3*D); s.proj = nn.Linear(D, D)
        s.fc = nn.Linear(D, 4*D); s.out = nn.Linear(4*D, D)
    def forward(s, x):
        b, t, c = x.shape
        q, k, v = s.qkv(s.ln1(x)).split(c, dim=2)
        q, k, v = [z.view(b, t, s.H, c//s.H).transpose(1, 2) for z in (q, k, v)]
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True)
        x = x + s.proj(y.transpose(1, 2).reshape(b, t, c))
        return x + s.out(F.gelu(s.fc(s.ln2(x))))

class GPT(nn.Module):
    def __init__(s, V, T, D, L, H):
        super().__init__()
        s.tok = nn.Embedding(V, D); s.pos = nn.Embedding(T, D)
        s.blocks = nn.ModuleList([Block(D, H) for _ in range(L)])
        s.lnf = nn.LayerNorm(D)
        for m in s.modules():
            if isinstance(m, (nn.Linear, nn.Embedding)):
                nn.init.normal_(m.weight, 0.0, 0.02)
                if getattr(m, "bias", None) is not None:
                    nn.init.zeros_(m.bias)
        for b in s.blocks:
            for m in (b.proj, b.out):
                nn.init.normal_(m.weight, 0.0, 0.02/(2*L)**0.5)
    def forward(s, idx):
        x = s.tok(idx) + s.pos(torch.arange(idx.shape[1], device=idx.device))
        for b in s.blocks:
            x = b(x)
        return s.lnf(x) @ s.tok.weight.T
