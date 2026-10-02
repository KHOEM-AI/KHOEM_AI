# Changelog

## 0.2.0
- Registry: 60 -> 61 languages (added Mongolian `mn` / ISO 639-3 `mon` / Cyrl).
- Translation data (status: partial, imported from AI `src/i18n`, genuinely translated keys only; no English copies): `ar` 37/105, `fr` 16/105, `mn` 17/105, `fil` 16/105 (`tl` resolves to `fil`).
- Added `ai.menu.*` keys (en, km); refined Khmer menu labels.
- Tests updated: unregistered-data examples now use `af`; language count 61.

## 0.1.0
- Core foundation: 60-language registry (ISO 639 / BCP 47 / ISO 15924), locale + region registries.
- Resolver, structure-based fallback chain, loader (registry-approved), LRU cache, translator (interpolation, CLDR plurals).
- Validation, duplicate detection, coverage report, tests.
- Translation data: `en` (canonical source), `km` (draft, needs native review).
- NOT yet implemented: HTTP API, generate-locales, lint, publish pipeline, translations for the other 58 languages.
