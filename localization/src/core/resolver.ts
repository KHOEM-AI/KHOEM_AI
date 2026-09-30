import type { ResolveResult } from "../types/index.js";
import { buildFallbackChain } from "./fallback.js";

const MAX_TAG_LENGTH = 64;

/** Parse + canonicalize a BCP 47 tag. Returns null for invalid input (never throws). */
export function canonicalizeLocale(input: unknown): string | null {
  if (typeof input !== "string" || input.length === 0 || input.length > MAX_TAG_LENGTH) return null;
  try {
    const [canon] = Intl.getCanonicalLocales(input.replace(/_/g, "-"));
    return canon ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve a requested locale to the best supported locale using only its own
 * language family (never an unrelated language).
 */
export function resolveLocaleDetailed(requested: string, supported: Iterable<string>): ResolveResult {
  const canonical = canonicalizeLocale(requested);
  if (!canonical) return { requested, canonical: null, resolved: null, chain: [] };
  const set = new Set(supported);
  const chain = buildFallbackChain(canonical);
  const resolved = chain.find((c) => set.has(c)) ?? null;
  return { requested, canonical, resolved, chain };
}

export function resolveLocale(requested: string, supported: Iterable<string>): string | null {
  return resolveLocaleDetailed(requested, supported).resolved;
}
