# Attribution

## Third-party data

### hermitdave/FrequencyWords (2018 content lists)

- Source: https://github.com/hermitdave/FrequencyWords
- License as stated in `KHOEM_AI/src/core/ai/patterns/global-195-vocabulary.ts`: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Not yet independently verified at the source; see `corpus-sample/manifest.json` record `frequencywords-2018-001` (rights review: pending).
- Used in: `global-195-vocabulary.ts` (about 10,000 additional tokens, per the file header).
- Changes made: tokens selected from supported language lists, NFC-normalized and deduplicated per language. Icelandic and Thai were not taken from this source because of encoding issues.
- Open question: effect of the share-alike term on the license of the derived vocabulary data and this repository. Needs a human decision; no repository license has been chosen yet.

### Multilingual Open Text (MOT), Khmer / Voice of America

- Source: https://github.com/bltlab/mot (release v1.11 as recorded in `corpus-sample/manifest.json`). Paper: https://aclanthology.org/2022.lrec-1.224/
- Stated terms: the MOT collection is released under CC BY 4.0; the underlying Voice of America material is described by the authors as public domain under the conditions they reviewed. Not yet independently verified by this project; third-party content inside individual items is still being investigated (see `exclude-third-party.txt`).
- Status: rights review is pending (`mot-km-voa-001`). The raw files are kept locally, are not committed, and are not redistributed in this repository.
- Derived data: a frequency-filtered Khmer word list (`km-vocab-voa-001`) is described in `DATA_PROVENANCE.md`; no source text is written out. Its rights review is also pending.
- Obligation: credit the MOT authors and Voice of America, link the CC BY 4.0 license (https://creativecommons.org/licenses/by/4.0/), and state that changes were made.
