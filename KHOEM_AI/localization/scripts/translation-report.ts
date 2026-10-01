import { mkdirSync, writeFileSync } from "node:fs";
import { allCoverage } from "../src/core/coverage.js";
import { LANGUAGES } from "../src/registry/languages.js";
import { LOCALES } from "../src/registry/locales.js";

const rows = await allCoverage();
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`${pad("Language", 9)}${pad("Locale", 8)}${pad("Keys", 6)}${pad("Done", 6)}${pad("Missing", 9)}${pad("Cover%", 8)}${pad("Declared", 10)}Computed`);
for (const r of rows)
  console.log(`${pad(r.language, 9)}${pad(r.locale, 8)}${pad(r.totalKeys, 6)}${pad(r.translated, 6)}${pad(r.missing.length, 9)}${pad(r.coverage, 8)}${pad(r.declaredStatus, 10)}${r.computedStatus}`);

const withData = new Set(rows.map((r) => r.language));
const summary = {
  registeredLanguages: LANGUAGES.length,
  registeredLocales: LOCALES.length,
  languagesWithTranslationData: withData.size,
  languagesPlannedOnly: LANGUAGES.length - withData.size,
};
console.log("\n" + JSON.stringify(summary));
mkdirSync("reports", { recursive: true });
writeFileSync("reports/coverage.json", JSON.stringify({ summary, rows }, null, 2));
const md = ["| Language | Locale | Keys | Translated | Missing | Coverage | Declared | Computed |", "|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.language} | ${r.locale} | ${r.totalKeys} | ${r.translated} | ${r.missing.length} | ${r.coverage}% | ${r.declaredStatus} | ${r.computedStatus} |`)];
writeFileSync("reports/coverage.md", md.join("\n") + "\n");
