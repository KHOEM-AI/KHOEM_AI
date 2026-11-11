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
- Translation data: 53 languages at 273/273 keys (measured by `npm run report:translations`). `en` is the canonical source; `km` is a draft that needs native review; 21 are `review` and 30 are `draft` (machine translations, not human-reviewed)
- 8 registered languages are `planned` only (no translations yet; runtime falls back to `en`)
- Exact live numbers: `GET /health` (languages, locales, languages with data) or `npm run report:translations`

## Commands
`npm run build | test | validate:locales | check:duplicates | report:translations | verify`

## HTTP API (`npm run api`, port `8790`)
`GET /health` · `GET /api/languages[/<id>]` · `GET /api/locales[/<locale>]` · `GET|POST /api/translate` · `GET /api/coverage` · `GET /api/khmer?q=&exact=1` · `GET /api/knowledge?q=&exact=1`

## Not implemented yet
`generate-locales.ts`, lint, publish pipeline, translations for most languages.
Documentation index: `../docs/README.md`.

## Khmer knowledge data (source of truth)

- Files: `src/khmer/levels/level{1,2,3}/part-NNN.ts` (55401 entries in 76 parts, each at most 1000 entries). See `src/khmer/levels/README.md` and `ORIGIN.tsv`.
- Full guide (format, lookup, how to add safely, limits): `../docs/KHMER_KNOWLEDGE.md`.
- Entry format: `["key|alias2|alias3", "answer"]`. Answers are plain strings only.
- Lookup order in `search.ts`: level 1, then 2, then 3 (`KHMER_ALL_ENTRIES`); earlier entries win on duplicate keys.
  Spelling variants (ឲ/ឱ, ្ដ/្ត) are matched only as a fallback when the exact key is missing and the variants agree on one answer.
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

## Khmer word list (2026-10-30)
`node tools/khmer-words/extract.mjs` បង្កើត `data/khmer-words.tsv` (ពាក្យ + ចំនួនដង) និង `data/khmer-words.stats.json`។ មើល `tools/khmer-words/README.md`។

## Khmer words API (2026-11-05)
`GET /api/khmer-words?q=<khmer text>&to=<en|zh>`

- កាត់អត្ថបទខ្មែរជាពាក្យ (ICU `Intl.Segmenter`) ហើយត្រឡប់ `tokens` មាន `known` `tier` `count` `translation`
- `known` = មានក្នុង `data/khmer-words.clean.tsv` មិនមែនមានន័យបកប្រែទេ។ ព្យញ្ជនៈតែមួយ (ក ខ ឆ...) មិនរាប់ជាពាក្យ
- `translation` ចេញតែពេលពាក្យនោះមានក្នុងវចនានុក្រម (`/api/dictionary`)
- កូដ៖ `src/lexicon/khmerWords.ts`

## Phrase dictionary (draft, 2026-11-10)
`src/lexicon/phrases.ts` មានពាក្យ និងឃ្លាប្រចាំថ្ងៃ English · ខ្មែរ · 中文 (សួស្តី លេខ ថ្ងៃ គ្រួសារ ម្ហូប កិរិយាស័ព្ទ ប្រទេស...)
- ចូលក្នុង `/api/dictionary` ជា `source: "phrase"` ហើយ `/api/khmer-words` ប្រើវាសម្រាប់ព្រួញបកប្រែ
- **ព្រាង** ការបកប្រែមិនទាន់មានអ្នកខ្មែរ/ចិនផ្ទៀងផ្ទាត់ សូមកែកំហុសក្នុងឯកសារ
- បន្ថែម៖ ដាក់ជួរ `["English", "ខ្មែរ", "中文"]` ក្នុង `RAW` ហើយរត់ `npm test`
