# KHOEM_AI Khmer corpus: handoff (updated 2026-10-05)

Read this first. It supersedes the "Status snapshot" in CORPUS_STRATEGY.md.

## Owner principles
- Respect authors' rights. Use only text with clear rights or explicit permission.
- A new source is first a metadata-only pending candidate. It is counted only after rights review is approved.
- Keep the record clean so nothing becomes a problem later. Do not re-ask the owner questions already decided here.

## Target and progress
- Target: 50,000,000 Khmer words (revised by the owner from 75,000,000 on 2026-10-05).
- Counted: 23,388,795 (46.78%). Remaining: 26,611,205.
- Counted sources: mot-km-voa-001 = 16,278,627; km-wiki-001 = 7,110,168.
- Tokenizer: Intl.Segmenter:km:word.

## Source status (details in corpus-sample/manifest.json)
- mot-km-voa-001: approved (internal analysis, training). CC BY 4.0. 729 files excluded as likely third-party (exclude-third-party.txt); 144 files without outlet signals not human-reviewed; pipeline skips 821 non-Khmer articles.
- km-wiki-001: approved (internal analysis, training). CC BY-SA 4.0, share-alike decided by the owner.
- km-vocab-voa-001: derived wordlist, not corpus text, not counted. Approved for internal analysis and training.
- oscar-2201-km: rejected (text rights not held, access suspended, research-only).
- hplt-v2-khm-001: rejected (HPLT does not own the text; CC0 covers packaging only).
- vn-minority-corpus-km-001: pending (no data link, license unknown).
- frequencywords-2018-001: pending (multilingual wordlist, not a Khmer corpus source).

## Open items
- The GitHub repo is private. Before making it public or sharing the code, review or remove the VOA-derived tokens merged into KHOEM_AI/src/core/ai/patterns/global-195-vocabulary.ts (third-party scan of VOA is incomplete).
- Reaching 50M needs new rights-clear text: voluntary contributions from authors, or written permission from publishers (template: KHOEM_AI/corpus-sample/permission-request-template.md). Save any permission as license_evidence in the manifest.

## Repo layout
The repo root holds only .gitignore, README.md and the KHOEM_AI/ folder. Everything else, including corpus-sample/ and the docs, lives inside KHOEM_AI/.

## How to verify (run exactly like this)
cd ~/KHOEM_AI/KHOEM_AI/corpus-sample && node --max-old-space-size=3072 pipeline.mjs >/dev/null 2>&1
cd ~/KHOEM_AI/KHOEM_AI && node corpus-sample/assert.mjs | grep FAIL; echo "assert_exit=${PIPESTATUS[0]}"
Run assert.mjs from ~/KHOEM_AI/KHOEM_AI (the project folder; it uses relative paths). Expected: assert_exit=0.

## Gotchas
- manifest.json uses "datasets" (a list) and the key "dataset_id".
- Do not end a heredoc line with "&& \" (the shell waits for more input).
- Verify before commit. Eligible words must change only when a source is intentionally added or removed.
