/**
 * Generates a fallback chain from locale *structure* (never hard-coded per language).
 * zh-TW      -> zh-TW, zh-Hant-TW, zh-Hant, zh
 * zh-Hant-TW -> zh-Hant-TW, zh-TW, zh-Hant, zh
 * en-US      -> en-US, en
 */
export function buildFallbackChain(tag: string): string[] {
  const loc = new Intl.Locale(tag);
  const lang = loc.language;
  const region = loc.region;
  const explicitScript = loc.script;
  const script = explicitScript ?? loc.maximize().script;

  const candidates: (string | undefined)[] = [
    loc.baseName,
    region ? `${lang}-${region}` : undefined,
    !explicitScript && script && region ? `${lang}-${script}-${region}` : undefined,
    script ? `${lang}-${script}` : undefined,
    lang,
  ];
  const out: string[] = [];
  for (const c of candidates) {
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}
