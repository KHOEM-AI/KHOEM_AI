# KHOEM_AI (v0.2.0): Central Language & Localization Infrastructure

Central infrastructure for Language, Locale, Region, Translation, Resolution, Fallback, Loading, Cache and Validation.
Consumer projects (AI, RSV, VTH, CAI, KI, iQ-AI, MI-K, EI-T) consume it; it never depends on them.

## Termux quick start
    pkg update && pkg install nodejs git
    npm install
    npm run verify

## Usage
    import { getTranslation, createTranslator } from "@khoem-ai/localization";
    await getTranslation("km", "common.save");
    const tr = await createTranslator("km"); tr.t("welcome.user", { name: "KHOEM" });

## Status (measured, not claimed)
- 61 registered languages as of 0.2.0 (metadata: ISO 639, BCP 47, ISO 15924, direction); see `CHANGELOG.md`
- Translation data: `en` (canonical source) and `km` (draft, needs native review), plus partial data for `ar`, `fr`, `mn`, `fil`
- Other languages are `planned` (no translations yet; runtime falls back to `en`)
- Exact live numbers: `GET /health` (languages, locales, languages with data) or `npm run report:translations`

## Commands
`npm run build | test | validate:locales | check:duplicates | report:translations | verify`

## HTTP API (`npm run api`, port `8790`)
`GET /health` · `GET /api/languages[/<id>]` · `GET /api/locales[/<locale>]` · `GET|POST /api/translate` · `GET /api/coverage` · `GET /api/khmer?q=&exact=1` · `GET /api/knowledge?q=&exact=1`

## Not implemented yet
`generate-locales.ts`, lint, publish pipeline, translations for most languages.
Documentation index: `../docs/README.md`.

## Khmer knowledge data (source of truth)

- Files: `src/khmer/data.ts` (18,915 entries), `data.extra.1-4.ts` (25,555 entries, aggregated by `data.extra.ts`); total 44,470 entries, 50,965 unique triggers (measured 2026-10-28).
- Full guide (format, lookup, how to add safely, limits): `../docs/KHMER_KNOWLEDGE.md`.
- Entry format: `["key|alias2|alias3", "answer"]`. Answers are plain strings only.
- Lookup order in `search.ts`: `KHMER_ENTRIES` first, then `KHMER_EXTRA_ENTRIES`
  (earlier entries win on duplicate keys).
- Normalization (`norm`): NFC, trim, lowercase, strip trailing `? ។ ! ！ ？ , ， . ៖ ; ； :`,
  collapse whitespace. NOTE: the AI app uses a different `fold` (maps `្ដ` to `្ត`).
- API: `GET /api/khmer?q=<text>&exact=1` (exact) or without `exact` (fuzzy, edit distance <= 1-2).
- Consumers: the AI app (`AI/src/ai/khoemApi.mjs`) calls this API first.
- Do NOT put computed answers (functions, dates/times) here; they live in the AI app.
- Before adding entries: run `npm run verify` (build, duplicate check, locale validation, tests).
- Do NOT duplicate entries that already exist in AI `khmer.mjs` unless intentional.

## Dictionary API (2026-10-30)
`GET /api/dictionary?q=<word>&from=<en|km|zh>&to=<en|km|zh>`

- ស្វែងរកក្នុង UI phrases (en, km, zh) និងឈ្មោះពណ៌ (`src/lexicon/colors.ts`)
- ត្រឡប់ `found`, `matches` (`text`, `original`, `source`, `missing`) និង `suggestions`
- `missing: true` = មិនទាន់មានឈ្មោះក្នុងភាសានោះ (ខ្មែរភាគច្រើននៅទទេសម្រាប់ពណ៌កម្រ)
- មិនបកអត្ថបទសេរី ត្រឹមតែឃ្លា/ពាក្យដែលមានក្នុងទិន្នន័យ
- បន្ថែមពណ៌ថ្មី៖ កែ `src/lexicon/colors.ts` ហើយរត់ `npm test`
