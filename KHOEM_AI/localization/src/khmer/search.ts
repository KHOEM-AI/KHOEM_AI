import { KHMER_ENTRIES } from "./data.js";
const norm = (s: string): string => s.trim().toLowerCase().replace(/[?។!\s]+$/u, "");
const MAP = new Map<string, string>();
for (const [k, a] of KHMER_ENTRIES) for (const alias of k.split("|")) { const n = norm(alias); if (n && !MAP.has(n)) MAP.set(n, a); }
export function searchKhmerExact(q: string): string | null { return MAP.get(norm(q)) ?? null; }
export function searchKhmer(q: string): string | null { return searchKhmerExact(q); }
