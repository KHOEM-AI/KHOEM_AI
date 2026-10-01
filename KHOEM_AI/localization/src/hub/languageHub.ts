import { LANGUAGES } from "../registry/languages.js";
import { LOCALES } from "../registry/locales.js";
import { REGIONS } from "../registry/regions.js";
import { allCoverage } from "../core/coverage.js";
import type { LanguageRecord, LocaleRecord, RegionRecord } from "../types/index.js";

export interface LanguageHubEntry {
  readonly language: LanguageRecord;
  readonly locales: readonly LocaleRecord[];
  readonly regions: readonly RegionRecord[];
  readonly coveragePercent: number | null;
}

export async function buildLanguageHub(): Promise<readonly LanguageHubEntry[]> {
  const coverage = new Map<string, number>();
  for (const c of await allCoverage()) {
    if (!coverage.has(c.language) || c.locale === c.language) coverage.set(c.language, c.coverage);
  }
  return LANGUAGES.map((language) => ({
    language,
    locales: LOCALES.filter((l) => l.language === language.languageId),
    regions: REGIONS.filter((r) => r.languages.includes(language.languageId)),
    coveragePercent: coverage.get(language.languageId) ?? null,
  }));
}

export async function getHubEntry(languageId: string): Promise<LanguageHubEntry | null> {
  return (await buildLanguageHub()).find((e) => e.language.languageId === languageId) ?? null;
}
