KHOEM_AI — Language System

1. ស្ថានភាពបច្ចុប្បន្ន

ថត "languages/"

Path:

"~/KHOEM_AI/KHOEM_AI/languages/"

ចំនួនថត៖ 1

មានឯកសារ 2៖

- "frequencywords-languages.json"
- "language-registry.ts"

Language Registry សំខាន់

Path:

"~/KHOEM_AI/KHOEM_AI/localization/src/registry/languages.ts"

ឯកសារនេះមាន 60 language records និងជាប្រភពសំខាន់សម្រាប់ language metadata របស់ KHOEM_AI។

វាមានព័ត៌មាន៖

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

---

2. Source of Truth

KHOEM_AI គឺជា single source of truth សម្រាប់ language data។

Language metadata សំខាន់ស្ថិតនៅ៖

"~/KHOEM_AI/KHOEM_AI/localization/src/registry/languages.ts"

AI App មិនត្រូវរក្សា language registry ស្ទួនដោយខ្លួនឯងទេ។

AI App ត្រូវទាញ language data ពី KHOEM_AI API។

---

3. ឯកសារនៅក្នុង "languages/"

"frequencywords-languages.json"

Path:

"~/KHOEM_AI/KHOEM_AI/languages/frequencywords-languages.json"

តួនាទី៖

- ផ្ទុកទិន្នន័យ frequency words សម្រាប់ភាសា។
- មិនប្រើជំនួស language registry metadata ទេ។

"language-registry.ts"

Path:

"~/KHOEM_AI/KHOEM_AI/languages/language-registry.ts"

តួនាទី៖

- ជា language options/registry ជំនួយដែលមានពីមុន។
- មាន language codes មួយចំនួនដែលស្ថិតក្នុង registry 60 រួចហើយ។
- មិនត្រូវបង្កើត language ID ស្ទួនពីវាទៅ source registry ទេ។

«ប្រសិនបើឯកសារនេះលែងត្រូវបានប្រើប្រាស់ គួរតែពិនិត្យ references មុនពេលលុប។ មិនលុបដោយសន្មត់។»

---

4. "localization/dist/"

ឧទាហរណ៍៖

- "localization/dist/src/registry/languages.js"
- "localization/dist/src/registry/languages.d.ts"
- "localization/dist/src/registry/languages.js.map"

"dist/" គឺជា generated/build output។

ច្បាប់៖

- មិនកែ "dist" ដោយដៃ។
- កែ source នៅ "localization/src/"។
- បន្ទាប់មក build នឹងបង្កើត "dist" ឡើងវិញ។

---

5. Flow នៃប្រព័ន្ធ

KHOEM_AI Language Registry
        ↓
KHOEM_AI API
        ↓
AI App
        ↓
Language Selection / AI UI

AI App connection point:

"~/ai-project/AI/src/App.tsx"

App.tsx ត្រូវប្រើ language data ពី KHOEM_AI API ជំនួសការរក្សាបញ្ជីភាសាដាច់ដោយឡែក។

---

6. ចំនួនភាសា

បច្ចុប្បន្ន៖ 60 language records

គោលដៅគម្រោង៖ 307 languages

ចំណាំ៖

60 language records ≠ 60 languages ដែលមាន translation content 100%។

Language registry និង translation coverage គឺជារឿងពីរផ្សេងគ្នា។

---

7. គោលដៅ 307 Languages

ភាសាថ្មីដែលបន្ថែមក្រោយ ត្រូវប្រើរចនាសម្ព័ន្ធដូចគ្នា និងចូលទៅក្នុង source registry តែមួយ។

មិនត្រូវបង្កើត registry ថ្មីសម្រាប់ភាសាថ្មីទេ។

---

8. កំណត់ត្រាភាសា

គោលការណ៍៖

មួយភាសា = មួយ language record

Language record ត្រូវមាន metadata ដែលមានស្រាប់ក្នុង "LanguageRecord" ដូចជា៖

- "languageId"
- "iso639_1"
- "iso639_3"
- "bcp47"
- "englishName"
- "nativeName"
- "defaultScript"
- "direction"
- "status"
- "cldrSupport"

«Country/region និង flag មិនមែនជា fields ដែលមាននៅក្នុង "LanguageRecord" បច្ចុប្បន្នទេ។ ប្រសិនបើត្រូវការបន្ថែម វាត្រូវរៀបចំ schema ជាមុន មិនត្រូវដាក់ field សន្មត់ចូលទៅក្នុង record ដោយចៃដន្យ។»

---

9. ច្បាប់សម្រាប់បន្ថែមភាសា

ពេលបន្ថែមភាសាថ្មី៖

1. ពិនិត្យ language registry មុន។
2. ពិនិត្យថា language code មានរួចឬអត់។
3. បើមានរួច មិនបង្កើត duplicate។
4. បន្ថែម metadata ទៅ source registry តែមួយ។
5. KHOEM API ត្រូវផ្តល់ language data ទៅ AI App។
6. មិនកែ "dist" ដោយដៃ។
7. មិនកែ "node_modules" ជា source។
8. មិនបង្កើត file/folder ថ្មីដោយគ្មានតម្រូវការ។
9. រក្សាឈ្មោះ file/folder ឱ្យខ្លី និងច្បាស់។
10. បើមិនប្រាកដ មិនកែភ្លាមទេ—ពិនិត្យ references ជាមុន។

---

10. AI App

ទីតាំង៖

"~/ai-project/AI/src/App.tsx"

តួនាទី៖

- ទទួល language list ពី KHOEM API។
- បង្ហាញ language selection។
- ប្រើ language ដែលអ្នកប្រើជ្រើសសម្រាប់ AI/UI។

AI App មិនគួរមាន language source ផ្ទាល់ខ្លួនដែលស្ទួននឹង KHOEM_AI ទេ។

---

11. អ្វីដែលមិនត្រូវធ្វើ

- មិនចម្លង language list ទៅ "App.tsx"។
- មិនបង្កើត language registry ទីពីរ។
- មិនបង្កើត language source ថ្មីនៅក្រៅ KHOEM_AI ដោយគ្មានតម្រូវការ។
- មិនកែ generated "dist" ដោយដៃ។
- មិនយក "node_modules" មកធ្វើជា language source។
- មិនលុបឯកសារដែលសង្ស័យ មុនពេលពិនិត្យថាមាន code ប្រើវាឬអត់។
- មិនបង្កើត duplicate language IDs។

---

12. ស្ថានភាពឯកសារ

Path| ស្ថានភាព| តួនាទី
"KHOEM_AI/languages/frequencywords-languages.json"| មាន| Frequency-word data
"KHOEM_AI/languages/language-registry.ts"| មាន| Auxiliary/legacy language options
"KHOEM_AI/localization/src/registry/languages.ts"| មាន| Main language registry / source
"KHOEM_AI/localization/dist/src/registry/languages.js"| Generated| Build output
"KHOEM_AI/localization/dist/src/registry/languages.d.ts"| Generated| Type declaration
"KHOEM_AI/localization/dist/src/registry/languages.js.map"| Generated| Source map

---

13. សេចក្តីសង្ខេប

បច្ចុប្បន្ន៖

- "languages/" → 1 ថត
- ឯកសារនៅក្នុង "languages/" → 2
- Main language registry → "localization/src/registry/languages.ts"
- Language records → 60
- Project target → 307 languages
- KHOEM_AI → Single Source of Truth
- AI App → ប្រើ KHOEM API
- "dist/" → generated output
- "node_modules/" → dependency files មិនមែន language source

គោលការណ៍សំខាន់បំផុត៖

KHOEM_AI → Language Registry → KHOEM API → AI App

កុំបង្កើត language source ស្ទួន និងកុំឱ្យ AI App ក្លាយជាប្រភព language data។
