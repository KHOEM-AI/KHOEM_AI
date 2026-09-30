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
