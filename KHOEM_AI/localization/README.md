# KHOEM_AI (v0.1.0): Central Language & Localization Infrastructure

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
- 60 registered languages (metadata: ISO 639, BCP 47, ISO 15924, direction)
- 84 registered locales
- Translation data: `en` (canonical source, 24 keys) and `km` (draft, needs native review)
- The other 58 languages are `planned` (no translations yet; runtime falls back to `en`)

## Commands
`npm run build | test | validate:locales | check:duplicates | report:translations | verify`

## Not implemented yet
HTTP API, `generate-locales.ts`, lint, publish pipeline, docs/ folder, translations for other languages.

## Khmer knowledge data (source of truth)

- Files: `src/khmer/data.ts`, `data.extra.1-4.ts` (aggregated by `data.extra.ts`).
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
- 
