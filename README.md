KHOEM_AI — OFFICIAL MASTER ARCHITECTURE & BUILD SPECIFICATION

PROJECT NAME
KHOEM_AI

PROJECT ROLE
Central Language & Localization Infrastructure

PURPOSE
KHOEM_AI គឺជាប្រព័ន្ធកណ្តាលសម្រាប់ Language, Locale, Translation និង Localization ដែលត្រូវប្រើជាមូលដ្ឋានរួមសម្រាប់ Consumer Projects ទាំង 8៖

1. AI
2. RSV
3. VTH
4. CAI
5. KI
6. iQ-AI
7. MI-K
8. EI-T

IMPORTANT:
KHOEM_AI គឺជា Central Infrastructure។
AI, RSV, VTH, CAI, KI, iQ-AI, MI-K និង EI-T គឺជា Consumer Projects។
កុំចាត់ទុក Consumer Projects ទាំង 8 ជា Submodules របស់ KHOEM_AI។

==================================================
1. OFFICIAL NAMING
==================================================

Official Infrastructure Name:
KHOEM_AI

Official Consumer Project Names:
AI
RSV
VTH
CAI
KI
iQ-AI
MI-K
EI-T

KHOEM_AI ត្រូវមានតួនាទីជា:
Central Language Core
Central Localization Core
Language Registry
Locale Registry
Translation Registry
Translation Runtime
Localization API
Shared Language Package

==================================================
2. ARCHITECTURE PRINCIPLE
==================================================

Architecture:

                    KHOEM_AI
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   Language Data   Translation Core   Localization API
        │               │                │
        └───────────────┼────────────────┘
                        │
                 Shared Package
                        │
      ┌─────────┬───────┼───────┬─────────┐
      │         │       │       │         │
     AI        RSV     VTH     CAI       KI
      │
    iQ-AI
      │
    MI-K
      │
    EI-T

Core principle:

One Central Source
        ↓
One Registry
        ↓
One Translation Key Standard
        ↓
One Resolver
        ↓
One Fallback System
        ↓
One Validation System
        ↓
Many Consumer Projects

Consumer Projects must NOT create independent translation systems
for common shared keys.

==================================================
3. INTERNATIONAL STANDARDS
==================================================

KHOEM_AI must be designed around established international standards.

Use:

1. Unicode
2. BCP 47 Language Tags
3. ISO 639 language identifiers
4. ISO 15924 script identifiers
5. ISO 3166-1 region/country identifiers
6. Unicode CLDR
7. ECMAScript Intl APIs where applicable
8. ICU-compatible localization concepts where applicable

Do not invent alternative language-code standards.

Do not use country codes as language codes.

Do not assume:

1 country = 1 language

Do not assume:

1 language = 1 country

Language, Locale, Region and Country must remain separate concepts.

==================================================
4. CORE DATA MODEL
==================================================

KHOEM_AI must maintain four major registries:

A. Language Registry
B. Locale Registry
C. Region/Country Registry
D. Translation Registry

Relationship:

Language
    ↓
Locale
    ↓
Region / Country
    ↓
Translation

Example:

English
    ├── en
    ├── en-US
    ├── en-GB
    ├── en-AU
    └── en-CA

Chinese
    ├── zh
    ├── zh-CN
    ├── zh-TW
    └── zh-HK

Khmer
    └── km

A locale variant must NOT be treated as a completely different language.

==================================================
5. 60-LANGUAGE FOUNDATION
==================================================

Phase 1 must establish a 60-language foundation.

IMPORTANT:

60 languages does NOT mean 60 countries.

The 60-language foundation must be selected and registered using
validated international language identifiers and metadata.

Each language must have:

- language ID
- ISO 639 code where available
- ISO 639-3 fallback where necessary
- BCP 47 language tag
- English name
- Native name
- Default script
- Direction
- Status
- Registry metadata
- CLDR compatibility information

The system must support expansion beyond 60 languages.

Long-term target:

195+ language/locale coverage.

The number 195+ is a project expansion target.
It must NOT be represented as a claim that there are exactly 195
internationally standardized languages or that 195 languages are
already fully translated.

Language status must clearly distinguish:

planned
draft
partial
review
verified
complete
deprecated

A language may only be marked "complete" when validation confirms
required translation coverage.

==================================================
6. LANGUAGE REGISTRY
==================================================

Create a central Language Registry.

Each language record should contain, where applicable:

languageId
iso639_1
iso639_3
bcp47
englishName
nativeName
defaultScript
direction
status
cldrSupport
notes

Example conceptual record:

{
  languageId: "km",
  iso639_1: "km",
  iso639_3: "khm",
  bcp47: "km",
  englishName: "Khmer",
  nativeName: "ខ្មែរ",
  defaultScript: "Khmr",
  direction: "ltr",
  status: "verified"
}

The actual registry must be validated against authoritative standards.

Do not invent language codes.

==================================================
7. LOCALE REGISTRY
==================================================

Locale Registry must represent language + script + region combinations.

Examples:

en
en-US
en-GB
en-AU

km
km-KH

zh-CN
zh-TW
zh-HK

ar
ar-SA
ar-EG

Locale records should contain:

locale
language
script
region
direction
parentLocale
status
fallbackChain

BCP 47 canonicalization must be supported.

Use Intl.Locale where appropriate.

==================================================
8. REGION / COUNTRY MAPPING
==================================================

Create a separate Region/Country Registry.

Region data must NOT be mixed directly into the Language Registry.

Use ISO 3166-1 where applicable.

Example:

KH
US
GB
CN
TW
JP
KR

A country may have multiple languages.

A language may be used across multiple countries.

The architecture must support:

Country → multiple languages
Language → multiple countries
Country → multiple locales
Locale → language + region + script

==================================================
9. TRANSLATION KEY STANDARD
==================================================

Translation keys must be stable, predictable and shared.

Use dot notation.

Examples:

common.save
common.cancel
common.close
common.open
common.confirm
common.delete

navigation.home
navigation.settings
navigation.profile
navigation.dashboard

auth.login
auth.logout
auth.register
auth.forgotPassword

errors.network
errors.notFound
errors.unauthorized
errors.forbidden
errors.server

system.loading
system.success
system.error

The same common concept must use the same key across all
Consumer Projects.

Do NOT allow:

common.save
button.save
saveButton
save_action
btnSave

to represent the same shared concept.

Prefer one canonical key:

common.save

==================================================
10. TRANSLATION SOURCE OF TRUTH
==================================================

Define one canonical translation schema.

The canonical schema must establish:

- valid keys
- value type
- interpolation parameters
- optional metadata
- pluralization requirements
- context where necessary

The source language must be clearly defined.

Default recommendation:

English (en) = canonical source key schema.

Other languages are translations of the canonical schema.

Changing the source schema must trigger validation of all supported
languages.

==================================================
11. TRANSLATION STRUCTURE
==================================================

Translation data should support structured namespaces.

Example:

common:
  save
  cancel
  close

navigation:
  home
  settings

auth:
  login
  logout

errors:
  network
  notFound

Keys must be flattenable into:

common.save
common.cancel
navigation.home
auth.login
errors.network

Nested objects must be validated for consistent structure.

==================================================
12. UNICODE RULES
==================================================

All source files must use UTF-8.

Do not corrupt:

Khmer
Arabic
Chinese
Japanese
Korean
Thai
Hindi
Bengali
Tamil
etc.

The system must correctly support:

Unicode characters
Combining marks
Non-Latin scripts
RTL scripts
Unicode normalization where appropriate

Do not assume ASCII-only strings.

String handling must be Unicode-safe.

==================================================
13. BCP 47 RULES
==================================================

Locale identifiers must follow BCP 47.

Examples:

en
en-US
en-GB
km
km-KH
zh-CN
zh-TW
ar-SA

The Resolver must:

1. Parse requested locale.
2. Canonicalize locale.
3. Validate locale.
4. Identify language.
5. Identify script.
6. Identify region.
7. Find supported locale.
8. Apply fallback chain.

Invalid locale identifiers must not crash the system.

==================================================
14. CLDR RULES
==================================================

CLDR must be treated as the main international localization metadata
reference where applicable.

Use CLDR concepts for:

- language names
- region names
- scripts
- locale data
- number formatting
- date formatting
- plural categories
- direction
- locale behavior

Do not create custom pluralization rules for every language.

Use standard Intl/CLDR/ICU mechanisms where available.

==================================================
15. RESOLVER
==================================================

Create:

src/core/resolver.ts

Resolver responsibility:

Input:
requested locale

Output:
best supported locale

Example:

Requested:
en-US

Supported:
en
en-GB

Resolver may resolve:

en-US → en

Another example:

Requested:
km-KH

Supported:
km

Result:

km-KH → km

Resolver must understand:

language
script
region
parent locale
fallback hierarchy

Resolver must never select an unrelated language merely because
the requested language is unavailable.

==================================================
16. TRANSLATOR
==================================================

Create:

src/core/translator.ts

Primary function:

getTranslation(locale, key)

Example:

getTranslation("km", "common.save")

Optional interpolation:

getTranslation("km", "welcome.user", {
  name: "KHOEM"
})

Translator must support:

exact key lookup
locale resolution
fallback
interpolation
pluralization where implemented
diagnostic mode
missing-key detection

Missing translations must be detectable.

==================================================
17. FALLBACK SYSTEM
==================================================

Fallback order should be predictable.

Example:

Requested:
en-US

Try:

1. en-US
2. en
3. configured global fallback
4. missing-key handler

For:

zh-Hant-TW

possible chain:

zh-Hant-TW
zh-TW
zh-Hant
zh

The actual fallback chain must be generated from locale structure,
not hard-coded for individual languages.

Fallback must never silently hide missing translations in validation.

Runtime fallback and validation status must remain separate.

==================================================
18. LOADER
==================================================

Create:

src/core/loader.ts

Loader responsibilities:

- load locale data
- support lazy loading
- prevent arbitrary file loading
- use registry-approved locales
- support dynamic import where appropriate
- report invalid locale
- report missing locale data

The loader must not allow arbitrary filesystem paths from user input.

==================================================
19. CACHE
==================================================

Create:

src/core/cache.ts

Cache should support:

locale cache
translation cache
resolver cache where useful

Requirements:

- predictable cache keys
- memory-safe behavior
- configurable size where appropriate
- clear/invalidate operation
- no stale data after reload unless explicitly configured

Provide:

clearCache()

Optional:

clearLocaleCache(locale)

==================================================
20. VALIDATION
==================================================

Create:

scripts/validate-locales.ts

Validation must check:

1. Language code validity
2. Locale validity
3. BCP 47 format
4. Script validity
5. Region validity
6. Translation schema
7. Key structure
8. Duplicate keys
9. Missing keys
10. Invalid values
11. Empty translations
12. Placeholder mismatch
13. Unsupported locale references
14. RTL metadata
15. Registry uniqueness

Validation must return a non-zero process exit code when critical
errors exist.

==================================================
21. DUPLICATE DETECTION
==================================================

Create:

scripts/check-duplicates.ts

Detect:

duplicate language IDs
duplicate ISO codes
duplicate locale IDs
duplicate translation keys
duplicate aliases
duplicate registry records

Example:

common.save
common.save

must fail validation.

Also detect conflicting aliases such as:

common.save
button.save

when both are declared as aliases of the same canonical concept,
unless explicitly documented.

==================================================
22. MISSING-KEY DETECTION
==================================================

The canonical source language defines the expected key set.

For every supported locale:

Compare:

source keys
vs
translation keys

Report:

missing
extra
invalid
empty

Example:

English:
100 keys

Khmer:
97 keys

Report:

Missing:
3

Coverage:
97%

Do not mark Khmer as "complete".

==================================================
23. COVERAGE REPORT
==================================================

Create:

scripts/translation-report.ts

Generate a report containing:

Language
Locale
Total keys
Translated keys
Missing keys
Extra keys
Coverage percentage
Status

Example:

Language | Locale | Keys | Translated | Missing | Coverage | Status

The report must be machine-readable and human-readable.

Preferred formats:

JSON
Markdown
CLI table

Optional CSV output.

==================================================
24. TRANSLATION QUALITY STATES
==================================================

Use controlled statuses:

planned
draft
partial
review
verified
complete
deprecated

Rules:

planned:
No usable translation yet.

draft:
Translation exists but not validated.

partial:
Some required keys are translated.

review:
Translation exists and requires human review.

verified:
Translation passed automated validation and review process.

complete:
Required coverage is complete and validation passes.

deprecated:
No longer recommended.

Do not label a language "complete" based only on file existence.

==================================================
25. TRANSLATION PLACEHOLDERS
==================================================

Placeholder parameters must be consistent.

Example:

English:
"Hello, {{name}}"

Khmer:
"សួស្តី {{name}}"

Both must contain:

{{name}}

Validation must detect:

missing placeholder
extra placeholder
renamed placeholder

Example invalid:

English:
Hello {{name}}

Khmer:
សួស្តី {{user}}

This must be reported.

==================================================
26. PLURALIZATION
==================================================

Do not invent language-specific plural rules.

Use:

Intl.PluralRules
CLDR
ICU-compatible behavior

The system must be designed so languages with different plural
categories can be represented correctly.

Do not assume every language has only:

one
other

Support language-specific plural categories where required.

==================================================
27. RTL SUPPORT
==================================================

Languages such as Arabic and Hebrew must be represented with:

direction: "rtl"

Other languages normally use:

direction: "ltr"

Direction must come from validated locale metadata where possible.

Consumer projects must be able to retrieve direction:

getLocaleDirection(locale)

Example:

getLocaleDirection("ar")
→ "rtl"

==================================================
28. OFFICIAL PROJECT STRUCTURE
==================================================

Use a clean architecture similar to:

KHOEM_AI/
│
├── src/
│   ├── locales/
│   │   ├── af/
│   │   │   └── index.ts
│   │   ├── ar/
│   │   │   └── index.ts
│   │   ├── en/
│   │   │   └── index.ts
│   │   ├── km/
│   │   │   └── index.ts
│   │   ├── th/
│   │   │   └── index.ts
│   │   ├── zh-CN/
│   │   │   └── index.ts
│   │   ├── zh-TW/
│   │   │   └── index.ts
│   │   └── ...
│   │
│   ├── core/
│   │   ├── translator.ts
│   │   ├── resolver.ts
│   │   ├── fallback.ts
│   │   ├── loader.ts
│   │   └── cache.ts
│   │
│   ├── registry/
│   │   ├── languages.ts
│   │   ├── locales.ts
│   │   └── regions.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── format/
│   │   └── ...
│   │
│   └── index.ts
│
├── scripts/
│   ├── generate-locales.ts
│   ├── validate-locales.ts
│   ├── check-duplicates.ts
│   └── translation-report.ts
│
├── tests/
│   ├── core/
│   ├── locales/
│   ├── registry/
│   └── integration/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── LANGUAGE_REGISTRY.md
│   ├── LOCALE_REGISTRY.md
│   ├── TRANSLATION_KEYS.md
│   ├── FALLBACK.md
│   ├── API.md
│   ├── CONSUMER_INTEGRATION.md
│   └── CONTRIBUTING.md
│
├── api/
│   ├── ...
│
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
└── CHANGELOG.md

Keep generated data separate from manually maintained source where
appropriate.

==================================================
29. TYPESCRIPT FOUNDATION
==================================================

Use TypeScript as the primary implementation language.

Recommended baseline:

Node.js
TypeScript
ESM
strict TypeScript
Vitest or equivalent test runner
package exports

Enable strict type checking.

Avoid:

any
unsafe casts
implicit undefined behavior
unvalidated dynamic imports

Public APIs must have explicit types.

==================================================
30. PACKAGE API
==================================================

Expose a clean public API from:

src/index.ts

Minimum API:

getTranslation()
createTranslator()
resolveLocale()
getLanguage()
getLocale()
listLanguages()
listLocales()
hasTranslation()
getTranslationCoverage()
clearCache()

Example:

const text = getTranslation(
  "km",
  "common.save"
);

Example:

const translator = createTranslator("km");

translator.t("common.save");

Consumers should not need to know internal file paths.

Do not allow consumers to import:

src/locales/...
src/core/...
src/registry/...

directly as their normal integration method.

Use public package exports.

==================================================
31. HTTP API
==================================================

Provide an optional HTTP API layer.

Recommended endpoints:

GET /health

GET /api/languages

GET /api/locales

GET /api/languages/:language

GET /api/locales/:locale

GET /api/translate?locale=km&key=common.save

GET /api/coverage

POST /api/translate

The HTTP API must validate:

locale
key
parameters

Do not allow arbitrary filesystem access.

API errors must use structured JSON.

Example:

{
  "success": false,
  "error": {
    "code": "TRANSLATION_NOT_FOUND",
    "message": "Translation key not found"
  }
}

==================================================
32. HTTP API SECURITY
==================================================

Security requirements:

- validate all input
- reject invalid locale
- reject invalid translation key
- prevent path traversal
- do not expose filesystem paths
- do not expose secrets
- configurable CORS
- rate limiting where appropriate
- structured errors
- no arbitrary code execution
- no dynamic module loading from user input
- safe logging

Environment secrets must never be committed.

==================================================
33. TESTING
==================================================

Tests must cover:

Registry:
- language uniqueness
- locale uniqueness
- region uniqueness
- code validation

Resolver:
- exact locale
- language fallback
- region fallback
- script fallback
- invalid locale

Translator:
- existing key
- missing key
- interpolation
- fallback
- invalid input

Loader:
- valid locale
- invalid locale
- unavailable locale

Cache:
- cache hit
- cache miss
- invalidation
- clear

Validation:
- missing keys
- extra keys
- duplicate keys
- placeholder mismatch
- invalid locale
- invalid language

RTL:
- Arabic
- Hebrew
- other RTL locales as registered

Unicode:
- Khmer
- Arabic
- Chinese
- Japanese
- Korean
- Thai
- Hindi

Coverage:
- correct percentage
- incomplete language status
- complete language status

HTTP API:
- health
- language list
- locale list
- translation lookup
- validation errors
- security errors

==================================================
34. QUALITY GATES
==================================================

Before build succeeds, run:

1. TypeScript typecheck
2. Lint
3. Unit tests
4. Integration tests
5. Locale validation
6. Duplicate detection
7. Missing-key detection
8. Coverage report
9. Package build

If critical validation fails:

BUILD MUST FAIL.

Do not publish an invalid localization package.

==================================================
35. BUILD
==================================================

Build must produce a distributable package.

Requirements:

- compiled JavaScript
- type declarations
- source maps where appropriate
- package metadata
- public exports
- validated locale data

No development-only files should accidentally become public package
runtime dependencies.

==================================================
36. VERSIONING
==================================================

Use Semantic Versioning.

MAJOR:
Breaking API or schema changes.

MINOR:
Backward-compatible features or new language/locale support.

PATCH:
Bug fixes and translation corrections that do not break API.

Document changes in:

CHANGELOG.md

==================================================
37. PUBLISH
==================================================

Publishing must only happen after:

typecheck
test
validation
duplicate check
missing-key check
coverage report
build

Use package versioning.

Do not publish automatically from an unverified working tree.

Recommended distribution:

NPM package

Potential package name:

@khoem-ai/localization

If this name is unavailable, choose a documented official alternative
under the KHOEM_AI namespace.

==================================================
38. AUTOMATION SCRIPTS
==================================================

package.json scripts should provide commands conceptually equivalent
to:

validate
validate:locales
check:duplicates
check:missing
report:translations
test
test:coverage
typecheck
lint
build
pack
publish

A single command should be available for full verification.

Example concept:

npm run verify

verify must run all mandatory quality gates.

==================================================
39. DOCUMENTATION
==================================================

README.md must explain:

What KHOEM_AI is
Why it exists
Architecture
Standards
Supported languages
Locale system
Translation keys
Fallback
Package API
HTTP API
Validation
Consumer integration
Development
Testing
Build
Publish

Additional documentation:

ARCHITECTURE.md
LANGUAGE_REGISTRY.md
LOCALE_REGISTRY.md
TRANSLATION_KEYS.md
FALLBACK.md
API.md
CONSUMER_INTEGRATION.md
CONTRIBUTING.md

==================================================
40. CONSUMER INTEGRATION
==================================================

The following projects must consume KHOEM_AI:

AI
RSV
VTH
CAI
KI
iQ-AI
MI-K
EI-T

Each project must integrate through the official KHOEM_AI public API.

Do not duplicate the complete language registry inside each project.

Do not create eight different translation standards.

Do not create eight unrelated fallback systems.

Centralized:

Language Registry
Locale Registry
Translation Key Standard
Resolver
Fallback
Validation

Consumer-specific UI can still provide local overrides when explicitly
supported, but shared keys must follow KHOEM_AI standards.

==================================================
41. CONSUMER INTEGRATION PATTERN
==================================================

Consumer:

AI
    ↓
KHOEM_AI package/API
    ↓
Translator
    ↓
Locale Resolver
    ↓
Translation

Same architecture for:

RSV
VTH
CAI
KI
iQ-AI
MI-K
EI-T

==================================================
42. LOCAL OVERRIDE RULE
==================================================

Consumer projects may define application-specific translations only
when a key is truly application-specific.

Example:

ai.camera.scanResult

may belong to AI.

But:

common.save

must remain a shared KHOEM_AI key.

If a consumer defines an override, it must not silently redefine the
meaning of a global key.

==================================================
43. LANGUAGE EXPANSION
==================================================

Phase 1:
60-language foundation.

Phase 2:
Expand registry and locale coverage.

Phase 3:
100+ language/locale coverage.

Phase 4:
150+ coverage.

Long-term:
195+ target.

Expansion must be data-driven.

Adding a language must not require rewriting the translation engine.

A new language should require:

registry entry
locale metadata
translation data
validation
tests
coverage report

not a rewrite of core logic.

==================================================
44. DATA GENERATION
==================================================

generate-locales.ts must be able to generate locale structures from
validated registry/source data.

Do not manually duplicate identical metadata across dozens of files.

Generated data must be reproducible.

Running generation twice with the same source data must produce the
same result.

==================================================
45. NO FAKE TRANSLATIONS
==================================================

The system must never pretend a translation is complete when it is
not.

Do not fill missing languages with copied English text and mark them
as translated.

If a translation is unavailable:

status = partial/draft/planned

or runtime fallback may use the configured fallback language.

Coverage must remain accurate.

==================================================
46. NO FALSE INTERNATIONAL CLAIMS
==================================================

Do not claim:

"All countries supported"

"All world languages supported"

"195 languages complete"

unless the validation system actually proves the statement.

Use measurable facts:

60 registered languages
X verified locales
Y translation keys
Z% coverage

==================================================
47. ERROR HANDLING
==================================================

Use structured error types.

Examples:

INVALID_LOCALE
UNSUPPORTED_LOCALE
LANGUAGE_NOT_FOUND
LOCALE_NOT_FOUND
TRANSLATION_NOT_FOUND
MISSING_TRANSLATION
INVALID_TRANSLATION_KEY
INVALID_PARAMETERS
REGISTRY_VALIDATION_ERROR

Errors must be predictable and testable.

==================================================
48. OBSERVABILITY
==================================================

Provide optional diagnostics.

Development mode may report:

requested locale
resolved locale
translation key
fallback used
missing key
cache hit/miss

Production mode should avoid exposing sensitive internal details.

Diagnostics must be configurable.

==================================================
49. PERFORMANCE
==================================================

The system should support:

lazy locale loading
memory caching
resolver caching
small runtime footprint
tree-shaking where possible

Do not load all languages into memory if the consumer only needs
one or a small number of locales.

==================================================
50. ARCHITECTURAL RULE
==================================================

The Translation Engine must NOT depend on any consumer project.

Correct:

KHOEM_AI
   ↓
AI
RSV
VTH
CAI
KI
iQ-AI
MI-K
EI-T

Incorrect:

AI
   ↓
KHOEM_AI
   ↓
RSV
   ↓
VTH

Consumer projects must remain independent consumers.

==================================================
51. SOURCE CONTROL
==================================================

Use clean Git history.

Recommended initial commits:

1. Initialize KHOEM_AI architecture
2. Add language and locale registry
3. Add translation schema
4. Add resolver/fallback/loader/cache
5. Add validation tooling
6. Add tests
7. Add HTTP API
8. Add documentation
9. Add package build
10. Add consumer integration examples

Do not commit:

.env
API secrets
private credentials
generated temporary logs
node_modules
build cache

==================================================
52. DEVELOPMENT WORKFLOW
==================================================

Development order:

STEP 1
Create KHOEM_AI repository.

STEP 2
Create TypeScript foundation.

STEP 3
Create types.

STEP 4
Create Language Registry.

STEP 5
Create Locale Registry.

STEP 6
Create Region Registry.

STEP 7
Create canonical translation schema.

STEP 8
Add 60-language foundation.

STEP 9
Create Resolver.

STEP 10
Create Fallback.

STEP 11
Create Loader.

STEP 12
Create Cache.

STEP 13
Create Translator.

STEP 14
Create validation scripts.

STEP 15
Create duplicate detection.

STEP 16
Create missing-key detection.

STEP 17
Create coverage report.

STEP 18
Create tests.

STEP 19
Create package API.

STEP 20
Create HTTP API.

STEP 21
Create documentation.

STEP 22
Create build pipeline.

STEP 23
Create publish pipeline.

STEP 24
Create consumer integration examples.

==================================================
53. ACCEPTANCE CRITERIA
==================================================

The KHOEM_AI project is considered ready only when:

[ ] Architecture exists
[ ] TypeScript strict mode passes
[ ] Language Registry works
[ ] Locale Registry works
[ ] Region Registry works
[ ] 60-language foundation exists
[ ] BCP 47 validation works
[ ] Unicode-safe behavior verified
[ ] CLDR-aligned metadata verified
[ ] Resolver works
[ ] Fallback works
[ ] Translator works
[ ] Loader works
[ ] Cache works
[ ] Duplicate detection works
[ ] Missing-key detection works
[ ] Coverage report works
[ ] Placeholder validation works
[ ] RTL support works
[ ] Tests pass
[ ] Package API works
[ ] HTTP API works
[ ] Documentation complete
[ ] Build passes
[ ] Publish validation passes
[ ] Consumer integration documented

==================================================
54. FINAL ARCHITECTURAL DEFINITION
==================================================

KHOEM_AI is the centralized Language and Localization Infrastructure.

Its responsibility is:

LANGUAGE
+
LOCALE
+
REGION
+
TRANSLATION
+
RESOLUTION
+
FALLBACK
+
LOADING
+
CACHE
+
VALIDATION
+
REPORTING
+
PACKAGE
+
API

Consumer Projects:

AI
RSV
VTH
CAI
KI
iQ-AI
MI-K
EI-T

consume KHOEM_AI.

The architecture must remain:

CENTRAL
STANDARDIZED
VALIDATED
EXTENSIBLE
SECURE
UNICODE-SAFE
BCP47-COMPATIBLE
CLDR-ALIGNED
TESTED
PACKAGEABLE
API-READY
SCALABLE

==================================================
55. IMPORTANT INSTRUCTIONS TO THE CODING AI
==================================================

START FROM ZERO.

Do not reuse an old localization architecture unless explicitly
requested.

Do not modify existing consumer projects during the initial
KHOEM_AI build.

First build KHOEM_AI as an independent infrastructure project.

Do not create fake implementations.

Do not create placeholder files that pretend to provide functionality.

Do not mark incomplete languages as complete.

Do not invent language codes.

Do not invent country codes.

Do not mix language and country concepts.

Do not duplicate the translation engine in consumer projects.

Do not put secrets in source code.

Do not skip validation.

Do not skip tests.

Do not skip documentation.

When a standard exists, prefer the standard over a custom convention.

When an architectural decision is necessary, document the decision.

If a requirement conflicts with an international standard, preserve
the international standard and document the compatibility decision.

The final implementation must be maintainable by another developer
without requiring knowledge of the original author.

==================================================
56. REQUIRED FINAL DELIVERY
==================================================

The coding system must deliver:

1. Complete KHOEM_AI repository
2. Complete source tree
3. Complete TypeScript implementation
4. 60-language foundation
5. Language Registry
6. Locale Registry
7. Region Registry
8. Translation Registry
9. Resolver
10. Translator
11. Fallback
12. Loader
13. Cache
14. Validation
15. Duplicate Detection
16. Missing-Key Detection
17. Coverage Report
18. Test Suite
19. Package API
20. HTTP API
21. Documentation
22. Build configuration
23. Publish configuration
24. Consumer Integration documentation
25. Verification command
26. Final architecture report
27. Final test report
28. Final language/locale coverage report

Before declaring the project complete, show:

ARCHITECTURE STATUS
REGISTRY STATUS
LANGUAGE STATUS
LOCALE STATUS
TRANSLATION COVERAGE
VALIDATION STATUS
TEST STATUS
BUILD STATUS
PACKAGE STATUS
API STATUS
DOCUMENTATION STATUS

Do not declare COMPLETE until all mandatory quality gates pass.
