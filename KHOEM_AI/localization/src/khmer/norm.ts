/**
 * Khmer key/query normalization. Used for matching only; stored text is never changed.
 *  normKhmer: NFC, zero-width characters removed, trim, lowercase, trailing punctuation removed, spaces collapsed.
 *  foldKhmer: normKhmer plus the spelling variants ឲ→ឱ and ្ដ→្ត. Used only as a fallback after an exact normKhmer match fails.
 */
export function normKhmer(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[?។!！？,，.៖;；:]+$/u, "")
    .replace(/\s+/gu, " ");
}

export function foldKhmer(s: string): string {
  return normKhmer(s).replace(/\u17B2/gu, "\u17B1").replace(/\u17D2\u178A/gu, "\u17D2\u178F");
}
