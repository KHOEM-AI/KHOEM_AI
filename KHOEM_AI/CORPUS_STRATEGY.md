# KHOEM AI Corpus Strategy

**Status:** P0 design only. This document does not authorize corpus-content collection. No corpus payloads have been collected by this change.

## Goal and counting rule

The planning target is **75,000,000 retained word-token occurrences** across rights-approved datasets. Count only text that has passed parsing, normalization, privacy/quality checks, and exact document deduplication. A repeated word occurrence inside a retained document counts again; vocabulary type counts are a separate metric. Report counts by language, data type, dataset, and tokenizer version as well as the aggregate. Pin and version each language tokenizer; whitespace splitting is not a valid default for languages without reliable whitespace word boundaries.

The existing 70,209-entry vocabulary at KHOEM_AI/src/core/ai/patterns/global-195-vocabulary.ts is a separate lexicon asset. It is not corpus text and does not count toward this target.

## Corpus composition

Each dataset has one primary data_type:

- native - text originally authored in the recorded language.
- parallel - aligned text in two or more languages; retain alignment and per-side language provenance.
- instruction - instruction / response examples with source and rights lineage.
- dialogue - conversational text with role and privacy checks.
- knowledge - reference or explanatory text.
- synthetic - generated content, always labeled synthetic and linked to model, prompt/template, generation date, and input-source lineage where applicable.

Track additional characteristics with tags rather than changing the primary type. Never report synthetic material as human-authored. Track language and source concentration; do not claim balanced coverage until the per-language reports support it. Khmer coverage is reported explicitly, not inferred from source-country metadata.

## Source admission principles

1. Publicly reachable does not mean licensed for collection, model training, evaluation, or redistribution. Verify each intended use separately.
2. A source is blocked until its exact license/terms, evidence, restrictions, and permitted purposes are recorded and a reviewer marks rights review approved.
3. Do not collect private, login-gated, leaked, confidential, or paywalled content without explicit rights that cover the intended acquisition and use. At P0, exclude sensitive personal data and personal account content.
4. Unknown, conflicting, or missing rights evidence means blocked, not assumed permission. Preserve attribution, share-alike, notice, and other obligations per source; do not combine incompatible license groups without review.
5. Synthetic data requires its own provenance and policy review; generation does not erase restrictions inherited from prompts or source material.
6. Keep source files and derived records traceable to their source, version, license evidence, and transformations. Respect takedown, deletion, and retention obligations.

## P0 gates

P0 is limited to defining policy, provenance fields, and the future pipeline contract. No corpus files may be downloaded or ingested until:

- the provenance schema and processing states in DATA_PROVENANCE.md are adopted;
- a human reviewer approves the data policy and the source-specific license evidence;
- allowed purposes, retention/deletion handling, and privacy exclusions are recorded for each source;
- language-specific tokenizers and the 75M counting rule are pinned;
- validation, quarantine, deduplication, and audit-log behavior are implemented and tested on synthetic fixtures or separately approved samples.

A source that fails any gate remains metadata-only or is rejected. P0 does not create an allowlist or approve any source by implication.

## Status snapshot (2026-10-05)

Verified retained word tokens: 23,319,234 of 75,000,000 (31.09%); remaining 51,680,766. Contributors: mot-km-voa-001 16,209,066 and km-wiki-001 7,110,168. Sources reviewed and not counted: oscar-2201-km (rejected), frequencywords-2018-001 (pending, wordlist rather than text), km-vocab-voa-001 (derived wordlist), vn-minority-corpus-km-001 (pending, license and size unknown).
Note: files in pending-third-party-review.txt are excluded from the count (effective 144 articles). The third-party scan of MOT is not verified complete.

No further source with clear rights and large Khmer text volume has been identified. Reaching 75M requires either new rights-approved sources (for example, written permission from rights holders) or a revised target. The target above is unchanged until the owner decides.

Target history (owner): 75,000,000 -> 50,000,000 -> restored to 75,000,000 on 2026-10-05. The 75,000,000 target is in force.
