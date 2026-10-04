# Corpus Pipeline Contract

**Status:** P0 design only. This defines future processing behavior; it does not authorize downloads, ingestion, or training. No source allowlist or corpus payload is created here.

## Invariants

- A source must pass the rights gate in DATA_PROVENANCE.md before content acquisition. Metadata-only discovery is not content approval.
- Preserve source, file, and record lineage through every transformation. Each output is traceable to its input checksum, dataset ID, license evidence, pipeline version, and decision log.
- Unknown rights, unresolved restrictions, missing provenance, or failed privacy/quality checks means blocked or quarantined, never silently accepted.
- Separate datasets by rights group where obligations differ. Keep attribution and share-alike requirements available with every downstream export.
- The 70,209-entry vocabulary is a separate asset, not corpus input or part of the 50M token count.
- Pipeline stages must be deterministic where practical, resumable, and idempotent. A retry must not create untracked duplicate records.

## State progression

Normal progression:

DISCOVERED -> RIGHTS_REVIEW -> APPROVED -> ACQUIRED -> VALIDATED -> NORMALIZED -> QUALITY_PASSED -> DEDUPLICATED -> READY

QUARANTINED, REJECTED, and FAILED are terminal or review states. Every transition records timestamp, actor/tool, policy/schema version, input/output IDs, and a reason. Only a human rights reviewer may set APPROVED; processing code must not infer approval.

## Stages

1. **Discover (metadata only).** Create a candidate manifest with source name/URL, language, version, data type, license evidence location, and an initial review status. Do not fetch corpus payloads.
2. **Rights gate.** A human reviewer verifies source terms and evidence, acquisition permission, each intended use, attribution/share-alike obligations, privacy exclusions, retention, and takedown handling. Reject or keep metadata-only if any required point is unclear.
3. **Acquire to quarantine.** Only an approved manifest may enter the acquisition step. Record retrieval time, method, source version, file list, and SHA-256 for each original file. Restrict access according to the source terms; do not mix unapproved files into a ready partition.
4. **Validate and extract.** Check checksums, file types, encoding, archive safety, parser errors, and source version. Preserve original files unchanged where retention terms allow; record parser/tool versions and all extraction decisions. Quarantine malformed or unexpected payloads.
5. **Normalize.** Apply documented Unicode normalization and format cleanup without changing meaning. Keep raw-to-normalized mapping and transformation versions. Never discard a source record without a reason code.
6. **Identify language and tokenize.** Store detected and reviewed language tags per record. Pin tokenizer name/version/configuration per language. For languages without reliable whitespace boundaries, use a language-specific tokenizer. Record uncertain-language decisions for review.
7. **Privacy and quality review.** Apply the approved privacy policy, language/encoding checks, duplicate boilerplate checks, and quality thresholds. At P0, sensitive personal data and private account content are excluded, not retained for later cleanup. Quarantine uncertain cases; log reason codes and counts.
8. **Deduplicate.** First compare file SHA-256, then exact normalized document hashes. Preserve a canonical record and duplicate-to-canonical links. Near-duplicate detection is report-only until a threshold and review process are approved; never merge across rights groups without review.
9. **Partition and release.** Split at source/document level to reduce train/evaluation leakage. Produce an immutable manifest with dataset/file/record IDs, rights group, language, data type, tokenizer version, quality status, hashes, and aggregate counts. Attach attribution and restriction notices to every export. No release may exceed approved purposes.

## Counting and reports

The 50,000,000 goal is retained word-token occurrences after validation, normalization, privacy/quality review, and exact document deduplication. Repeated occurrences within retained documents count; repeated documents do not. Report raw extracted counts, excluded/quarantined counts, accepted counts, and deduplication deltas separately. Every count is grouped by language, data type, dataset, tokenizer/version, and rights group. Do not add the lexicon's unique term count to corpus tokens.

## Failure handling and audit

- Store structured reason codes for rights_blocked, license_unknown, checksum_mismatch, unsupported_format, parse_error, language_uncertain, privacy_rejected, quality_failed, duplicate_exact, and source_takedown (additional codes may be versioned).
- Retries use stable dataset/file/record IDs and do not overwrite prior evidence. Corrections create a new manifest version with links to the prior version.
- A takedown, license change, or source restriction change blocks new processing and triggers a traceability query for all derived records and released snapshots.
- Keep operational logs free of corpus text and sensitive data; log IDs, hashes, decisions, and counts instead.

## P0 exit criteria before any content collection

P0 is complete only after the provenance schema and this contract are reviewed, a human owner approves the data policy, at least one specific source has complete license evidence and explicit approved purposes, an allowlist and retention/deletion procedure exist, language tokenizers and count reports are versioned, and the pipeline's tests pass on synthetic fixtures or separately approved samples. These documents alone do not satisfy source approval. Until all gates pass, do not collect corpus content.
