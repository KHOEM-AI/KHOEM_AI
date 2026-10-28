# KHOEM_AI · សន្ទស្សន៍ឯកសារ (Docs Index)

ចំណុចចាប់ផ្តើមសម្រាប់អានឯកសារទាំងអស់ក្នុង repo នេះ។ ឯកសារទាំងអស់នៅក្រោម `KHOEM_AI/` លើកលែង `README.md` នៅ root។

## ចាប់ផ្តើមនៅទីនេះ

| ឯកសារ | ប្រធានបទ |
|---|---|
| `../../README.md` | **Official Master Architecture & Build Specification** របស់ KHOEM_AI (Central Language & Localization Infrastructure) |
| `SYSTEM_MAP.md` | ផែនទីប្រព័ន្ធ៖ repo ទាំង ៦ port និងរបៀបបើក/បិទ `ai` |
| `../localization/README.md` | ការប្រើ package `@khoem-ai/localization` ពាក្យបញ្ជា និងស្ថានភាព |
| `../localization/CHANGELOG.md` | ប្រវត្តិកំណែ |

## ភាសា និងចំណេះដឹងខ្មែរ

| ឯកសារ | ប្រធានបទ |
|---|---|
| `KHMER_KNOWLEDGE.md` | ទិន្នន័យ Q&A ខ្មែរ 44,470 entries របៀបស្វែងរក និងរបៀបបន្ថែម |
| `../KHOEM_AI.md` | ស្ថានភាពប្រព័ន្ធភាសា (`languages/`, Language Registry) |

## Corpus ខ្មែរ និងសិទ្ធិប្រភព

| ឯកសារ | ប្រធានបទ |
|---|---|
| `../HANDOFF.md` | **អានមុនគេ** សម្រាប់ corpus៖ គោលដៅ ស្ថានភាពប្រភព ចំណុចបើកចំហ |
| `../CORPUS_STRATEGY.md` | យុទ្ធសាស្ត្រ corpus និងច្បាប់រាប់ពាក្យ |
| `../CORPUS_PIPELINE.md` | កិច្ចសន្យា (contract) ដំណើរការ corpus — ជាការរចនា P0 មិនទាន់អនុញ្ញាតការទាញយក |
| `../DATA_PROVENANCE.md` | គំរូ metadata ប្រភពទិន្នន័យ និងសិទ្ធិ |
| `../DATA_SOURCE_ALLOWLIST.md` | គំរូពិនិត្យប្រភព (មិនអនុញ្ញាតការប្រមូលដោយខ្លួនឯង) |
| `../ATTRIBUTION.md` | ការរៀបរាប់ប្រភពភាគីទីបី (ឧ. FrequencyWords) អាជ្ញាបណ្ណ និងសំណួរបើកចំហ |
| `../corpus-sample/permission-request-template.md` | គំរូសំណើសុំការអនុញ្ញាត |
| `../../research/HUMAN_REVIEW_CHECKLIST.md` | បញ្ជីពិនិត្យដោយមនុស្ស |

## ច្បាប់ការងារ

1. អាន `HANDOFF.md` មុនប៉ះ corpus។ គោរពសិទ្ធិអ្នកនិពន្ធ (ប្រភពថ្មីជា `pending` រហូតដល់ពិនិត្យសិទ្ធិ)។
2. បន្ថែមទិន្នន័យ = ឯកសារថ្មី មិនកែឯកសារចាស់ (មើល `KHMER_KNOWLEDGE.md` ផ្នែក ៥)។
3. មុន commit៖ `npm run verify` និង `git diff --check`។ `git add <file>` តាមឈ្មោះ។
4. កុំដាក់ key ឬលេខសម្ងាត់ក្នុង GitHub។
5. ពេលកែលេខ (ចំនួន entries, ភាសា, ឯកសារ) ត្រូវវាស់ពីកូដ ហើយដាក់កាលបរិច្ឆេទ។
