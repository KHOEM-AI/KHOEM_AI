import { LANGUAGES } from "../src/registry/languages.js";
import { LOCALES } from "../src/registry/locales.js";
import { REGIONS } from "../src/registry/regions.js";

function dupes(label: string, values: readonly string[]): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const v of values) { if (seen.has(v)) out.push(`${label}: duplicate "${v}"`); seen.add(v); }
  return out;
}
const problems = [
  ...dupes("language ID", LANGUAGES.map((l) => l.languageId)),
  ...dupes("ISO 639-3", LANGUAGES.map((l) => l.iso639_3)),
  ...dupes("ISO 639-1", LANGUAGES.flatMap((l) => (l.iso639_1 ? [l.iso639_1] : []))),
  ...dupes("BCP 47", LANGUAGES.map((l) => l.bcp47)),
  ...dupes("locale ID", LOCALES.map((l) => l.locale)),
  ...dupes("region code", REGIONS.map((r) => r.code)),
];
if (problems.length) { problems.forEach((p) => console.error(`ERROR ${p}`)); process.exit(1); }
console.log("Duplicate check: PASSED");
