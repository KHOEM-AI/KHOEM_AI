# Khmer word list tool · ឧបករណ៍បញ្ជីពាក្យខ្មែរ

បង្កើតបញ្ជីពាក្យខ្មែរតែមួយ `data/khmer-words.tsv` (ពាក្យ ហើយចំនួនដងឃើញ) ពីអត្ថបទខ្មែរក្នុងទូរស័ព្ទ។

## ប្រើ
    node tools/khmer-words/extract.mjs                 # ស្កេនប្រភពដែលមានស្រាប់
    node tools/khmer-words/extract.mjs ~/ថត-ឬ-ឯកសារ   # បន្ថែមប្រភពថ្មី

## ចំណាំ
- កាត់ពាក្យដោយ ICU (`Intl.Segmenter`) ដូច្នេះមិនមែនវចនានុក្រមផ្ទៀងផ្ទាត់ទេ ឈ្មោះ និងបំណែកពាក្យអាចចូលដែរ។
- ពាក្យដែលឃើញច្រើនដង (`seen_5_plus`) គួរទុកចិត្តជាង។
- បន្ថែមតែអត្ថបទដែលមានសិទ្ធិប្រើប្រាស់។
- លទ្ធផលសង្ខេបនៅ `data/khmer-words.stats.json`

## ប្រភពអត្ថបទបន្ថែម (2026-11-01)
- វិគីភីឌាខ្មែរ និងវិគីវចនានុក្រមខ្មែរ (Wikimedia dumps, CC BY-SA)
- ឯកសារដើមទុកក្នុង `~/khoem-corpora/` មិនរុយទៅ GitHub ទេ រុយតែបញ្ជីពាក្យ និងចំនួនដង
- ទាញម្ដងទៀត៖ លុប `~/khoem-corpora/*.xml` រួចរត់ស្គ្រីបទាញ

## បញ្ជីស្អាត (2026-11-01)
`node tools/khmer-words/tier.mjs` បង្កើត `data/khmer-words.clean.tsv` (ពាក្យ ចំនួន ថ្នាក់)
- A = ចំណងជើងវិគីវចនានុក្រមខ្មែរ ឬនៅក្នុងបញ្ជី VOA (ឃើញ ≥5)
- B = ឃើញ ≥5 ដង  ·  C = ឃើញ 2-4 ដង
- ដកចេញ៖ ឃើញ 1 ដង និងពាក្យរចនាសម្ព័ន្ធអក្សរខ្មែរខុស (ពិនិត្យដោយក្បួនសាមញ្ញ មិនមែនវចនានុក្រមទេ)
- `data/khmer-words.tsv` នៅជាបញ្ជីដើម (មិនបានសម្អាត)

## CC-100 ភាសាខ្មែរ (2026-11-01)
- `stream.mjs` អានអត្ថបទពី stdin ហើយបូកចំនួនពាក្យចូល `data/khmer-words.tsv` (រក្សាតែឃើញ ≥3 ដង)
- ប្រើ៖ `xz -dc km.txt.xz | head -c 600M | node tools/khmer-words/stream.mjs`
- ថ្នាក់ពាក្យ៖ `TIER_B=20 TIER_C=5 node tools/khmer-words/tier.mjs`
- អត្ថបទដើមនៅ `~/khoem-corpora/` មិនរុយទៅ GitHub ទេ (រុយតែបញ្ជីពាក្យ និងចំនួនដង)

## CC-100 ភាសាខ្មែរ (2026-11-01)
- `stream.mjs` អានអត្ថបទពី stdin ហើយបូកចំនួនពាក្យចូល `data/khmer-words.tsv` (រក្សាតែឃើញ ≥3 ដង)
- ប្រើ៖ `xz -dc km.txt.xz | head -c 600M | node tools/khmer-words/stream.mjs`
- ថ្នាក់ពាក្យ៖ `TIER_B=20 TIER_C=5 node tools/khmer-words/tier.mjs`
- អត្ថបទដើមនៅ `~/khoem-corpora/` មិនរុយទៅ GitHub ទេ (រុយតែបញ្ជីពាក្យ និងចំនួនដង)
