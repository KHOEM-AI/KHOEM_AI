import { LANGUAGES } from "../src/registry/languages.js";
import { LOCALES } from "../src/registry/locales.js";
import { REGIONS } from "../src/registry/regions.js";
import { LOCALE_LOADERS, SOURCE_LOCALE } from "../src/locales/index.js";
import { loadLocale } from "../src/core/loader.js";
import { extractPlaceholders } from "../src/core/translator.js";

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);

// 1-4, 14: language + locale registry validity
for (const l of LANGUAGES) {
  try {
    if (Intl.getCanonicalLocales(l.bcp47)[0] !== l.bcp47) err(`language ${l.languageId}: bcp47 not canonical`);
  } catch { err(`language ${l.languageId}: invalid BCP 47 tag`); }
  if (!/^[a-z]{3}$/.test(l.iso639_3)) err(`language ${l.languageId}: bad ISO 639-3`);
  if (l.iso639_1 !== undefined && !/^[a-z]{2}$/.test(l.iso639_1)) err(`language ${l.languageId}: bad ISO 639-1`);
  if (!/^[A-Z][a-z]{3}$/.test(l.defaultScript)) err(`language ${l.languageId}: bad ISO 15924 script`);
  if (!l.nativeName.trim() || !l.englishName.trim()) err(`language ${l.languageId}: empty name`);
}
const langIds = new Set(LANGUAGES.map((l) => l.languageId));
const regionCodes = new Set(REGIONS.map((r) => r.code));
const localeIds = new Set(LOCALES.map((l) => l.locale));

for (const r of REGIONS) {
  if (!/^[A-Z]{2}$/.test(r.code)) err(`region ${r.code}: bad ISO 3166-1 alpha-2`);
  for (const lg of r.languages) if (!langIds.has(lg)) warnings.push(`region ${r.code}: language ${lg} not in registry`);
}
for (const loc of LOCALES) {
  try {
    if (Intl.getCanonicalLocales(loc.locale)[0] !== loc.locale) err(`locale ${loc.locale}: not canonical`);
  } catch { err(`locale ${loc.locale}: invalid BCP 47`); continue; }
  if (!langIds.has(loc.language)) err(`locale ${loc.locale}: unsupported language reference ${loc.language}`);
  if (loc.region && !regionCodes.has(loc.region)) err(`locale ${loc.locale}: region ${loc.region} not in region registry`);
  if (loc.parentLocale && !localeIds.has(loc.parentLocale)) err(`locale ${loc.locale}: unknown parent ${loc.parentLocale}`);
  const lang = LANGUAGES.find((l) => l.languageId === loc.language);
  if (lang && lang.direction !== loc.direction) err(`locale ${loc.locale}: direction mismatch`);
}
if (LANGUAGES.length < 60) err(`60-language foundation not met (${LANGUAGES.length})`);

// Translation data
const src = await loadLocale(SOURCE_LOCALE);
for (const loc of Object.keys(LOCALE_LOADERS)) {
  if (!localeIds.has(loc)) { err(`data for unregistered locale: ${loc}`); continue; }
  const data = await loadLocale(loc);
  const cats = new Set(new Intl.PluralRules(loc).resolvedOptions().pluralCategories);
  for (const [k, v] of Object.entries(data)) {
    const s = src[k];
    if (s === undefined) { err(`${loc}: extra key ${k}`); continue; }
    if (typeof v === "string") {
      if (v.trim() === "") err(`${loc}: empty value ${k}`);
      if (typeof s !== "string") err(`${loc}: ${k} must be plural forms`);
      else if (extractPlaceholders(s).join() !== extractPlaceholders(v).join())
        err(`${loc}: placeholder mismatch in ${k}`);
    } else {
      if (typeof s === "string") { err(`${loc}: ${k} must be a string`); continue; }
      if (!v.other) err(`${loc}: ${k} missing required plural category "other"`);
      for (const [c, txt] of Object.entries(v)) {
        if (!cats.has(c as never)) err(`${loc}: ${k} uses plural category "${c}" not valid for locale`);
        if (!txt || !txt.trim()) err(`${loc}: ${k}.${c} empty`);
      }
      const need = new Set(Object.values(s).flatMap((t) => extractPlaceholders(t ?? "")));
      for (const t of Object.values(v)) for (const p of extractPlaceholders(t ?? ""))
        if (!need.has(p)) err(`${loc}: ${k} unknown placeholder ${p}`);
    }
  }
  const missing = Object.keys(src).filter((k) => !(k in data));
  if (missing.length) warnings.push(`${loc}: ${missing.length} missing key(s) (partial): ${missing.join(", ")}`);
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(`Validated ${LANGUAGES.length} languages, ${LOCALES.length} locales, ${Object.keys(LOCALE_LOADERS).length} data locales.`);
if (errors.length) { console.error(`FAILED: ${errors.length} critical error(s).`); process.exit(1); }
console.log("Locale validation: PASSED");
