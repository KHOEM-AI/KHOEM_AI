KHOEM_AI — Language Structure

ស្ថានភាពបច្ចុប្បន្ន

1. ថត "languages/"

Path:

"KHOEM_AI/KHOEM_AI/languages/"

ចំនួនថត៖ 1

ក្នុងថតនេះមានឯកសារ 2៖

1. "frequencywords-languages.json"
2. "language-registry.ts"

2. ឯកសារ Language Registry សំខាន់

Path:

"KHOEM_AI/KHOEM_AI/localization/src/registry/languages.ts"

ឯកសារនេះមាន 60 language records ហើយជាប្រភព registry សំខាន់សម្រាប់ language metadata របស់ KHOEM_AI។

វាមានព័ត៌មានដូចជា៖

- Language ID
- ISO 639-1
- ISO 639-3
- BCP 47
- English name
- Native name
- Script
- Text direction
- Language status
- CLDR support

3. "frequencywords-languages.json"

Path:

"KHOEM_AI/KHOEM_AI/languages/frequencywords-languages.json"

ឯកសារនេះជាទិន្នន័យ frequency words សម្រាប់ភាសា។ វាមិនគួរត្រូវបានយកទៅជំនួស "localization/src/registry/languages.ts" ជា language registry ទេ។

4. "language-registry.ts" ក្នុង "languages/"

Path:

"KHOEM_AI/KHOEM_AI/languages/language-registry.ts"

នេះជាឯកសារ language registry ចាស់/ជំនួយដែលមាន language options មួយចំនួន។

វាមានភាសា 13 ដែល code ទាំងអស់ស្ថិតក្នុង registry 60 រួចហើយ។

ដូច្នេះមិនគួរបង្កើត language IDs ស្ទួននៅកន្លែងផ្សេងទៀតទេ។

5. "localization/dist/"

មាន build output ដូចជា:

"localization/dist/src/registry/languages.js"

"localization/dist/src/registry/languages.d.ts"

"localization/dist/src/registry/languages.js.map"

ឯកសារ "dist" គឺ generated/build output។ មិនគួរកែដោយដៃ។ Source ត្រូវកែពី "localization/src/"។

Source of Truth

សម្រាប់ language metadata របស់ KHOEM_AI៖

"KHOEM_AI/KHOEM_AI/localization/src/registry/languages.ts"

គឺជា registry សំខាន់។

AI App មិនគួររក្សា language list ស្ទួនដោយខ្លួនឯងទេ។ AI App គួរទាញ language data ពី KHOEM_AI API។

របៀបប្រើប្រាស់

Flow សំខាន់៖

KHOEM_AI Language Registry
→ KHOEM_AI API
→ AI App
→ Language Selection / UI

AI App មិនគួរបង្កើត language registry ថ្មីដែលស្ទួនជាមួយ KHOEM_AI ទេ។

ចំនួនភាសា

បច្ចុប្បន្ន៖ 60 language records

គោលដៅរបស់គម្រោង៖ 307 languages

ចំនួន 60 records មិនមានន័យថា translation content របស់ 60 ភាសាបានបញ្ចប់ 100% ទេ។ Language registry និង translation coverage គឺជារឿងពីរផ្សេងគ្នា។

ច្បាប់សម្រាប់ការបន្ថែមភាសា

ពេលបន្ថែមភាសាថ្មី៖

1. ពិនិត្យ registry មុនថាមាន language code រួចឬអត់។
2. បើមានរួច មិនត្រូវបង្កើត duplicate។
3. បន្ថែម metadata ទៅ source registry តែមួយ។
4. KHOEM API ត្រូវជាប្រភពដែល AI App ប្រើ។
5. កុំកែឯកសារ "dist" ដោយដៃ។
6. កុំយក "node_modules" ឬ generated files មកធ្វើជា language source។

ស្ថានភាពឯកសារ

ឯកសារ| ស្ថានភាព| តួនាទី
"languages/frequencywords-languages.json"| មាន| Frequency-word data
"languages/language-registry.ts"| មាន| Legacy/auxiliary language options
"localization/src/registry/languages.ts"| មាន| Main language registry / source
"localization/dist/src/registry/languages.js"| Generated| Build output
"localization/dist/src/registry/languages.d.ts"| Generated| Type declaration
"localization/dist/src/registry/languages.js.map"| Generated| Source map

សេចក្តីសង្ខេប

"languages/" បច្ចុប្បន្នមាន 1 ថត និង 2 ឯកសារ។

Language registry សំខាន់ដែលមាន 60 records ស្ថិតនៅក្នុង:

"KHOEM_AI/KHOEM_AI/localization/src/registry/languages.ts"

គោលដៅរយៈពេលវែងគឺ 307 languages ដោយរក្សា KHOEM_AI ជា single source of truth និងជៀសវាង language data duplication។

KHOEM_AI — ប្រព័ន្ធភាសា

1. ប្រភពតែមួយ
- ទិន្នន័យភាសាទាំងអស់ស្ថិតនៅ ~/KHOEM_AI/ ជា Source of Truth។
- ទីតាំងទិន្នន័យ៖ ~/KHOEM_AI/languages/
  • language-registry.ts
  • frequencywords-languages.json

2. គោលដៅ
- 307 ភាសា។ ភាសាបច្ចុប្បន្ន និងភាសាបន្ថែមក្រោយ ត្រូវប្រើរចនាសម្ព័ន្ធដូចគ្នា។

3. កំណត់ត្រាភាសា
- មួយភាសា = មួយកំណត់ត្រា = មួយប្រទេស/តំបន់តំណាងច្បាស់លាស់។
- វាលចាំបាច់៖ code, nameEn, label, flag

4. ការតភ្ជាប់ទៅ AI App
KHOEM_AI → Language API → ~/ai-project/AI/src/App.tsx
- App.tsx ទាញយកបញ្ជីភាសាតាម API ប៉ុណ្ណោះ។
- ភាសាដែលជ្រើស ត្រូវប្រើជាភាសា AI/UI។

5. ច្បាប់សំខាន់
- កែ ឬបន្ថែមភាសា ធ្វើនៅ KHOEM_AI ជាមុនសិន។
- មិនចម្លងបញ្ជីភាសាទៅ App.tsx។
- មិនបង្កើត language source ទីពីរ។
- មិនបង្កើត file/folder ថ្មីដោយគ្មានតម្រូវការ។ រក្សាឈ្មោះឱ្យខ្លី សាមញ្ញ។
- មិនលាយបញ្ចូលកូដ ឬទិន្នន័យភាសាចូលគ្នាក្នុង file ផ្សេងៗ។ កែតែក្នុង ~/KHOEM_AI/languages/ ប៉ុណ្ណោះ។
- បើមិនប្រាកដ សូមសួរមុនពេលកែ។ ពេលចប់ ប្រាប់ឈ្មោះ file ដែលបានកែ។
