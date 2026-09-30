# Changelog

## 0.1.0
- Core foundation: 60-language registry (ISO 639 / BCP 47 / ISO 15924), locale + region registries.
- Resolver, structure-based fallback chain, loader (registry-approved), LRU cache, translator (interpolation, CLDR plurals).
- Validation, duplicate detection, coverage report, tests.
- Translation data: `en` (canonical source), `km` (draft, needs native review).
- NOT yet implemented: HTTP API, generate-locales, lint, publish pipeline, translations for the other 58 languages.
