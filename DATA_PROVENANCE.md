# Data Provenance and Rights Metadata

**Status:** Schema proposal for P0. The template below is not a source record. No corpus source or payload is approved by this document alone.

## Record model

Maintain one dataset manifest per source/version, plus file-level checksums and record-level lineage. Derived data must reference its parent dataset and every transformation; never merge records with different rights into an untraceable dataset. Store metadata separately from text payloads where practical.

The following fields are required in the dataset manifest:

| Field | Required meaning |
| --- | --- |
| dataset_id | Stable, unique identifier; do not reuse after rejection or retirement. |
| source_name | Publisher, collection, or originating organization/person as stated by the source. |
| source_url | Canonical source or license page. Use null only while undiscovered; this blocks approval. |
| source_country | ISO 3166-1 alpha-2 for the source origin, or UNKNOWN; do not infer it from language. |
| language | Human-readable language name(s); identify per side for parallel data. |
| language_code | BCP 47 language tag per language; use und only when unknown, and block language-specific release until resolved. |
| license | Exact license/terms identifier and version, or UNKNOWN. UNKNOWN blocks acquisition. |
| license_url | URL for the exact license/terms, or null while pending; null blocks approval. |
| data_type | One primary type: native, parallel, instruction, dialogue, knowledge, or synthetic. |
| collection_date | ISO 8601 date of first authorized acquisition; null before acquisition. |
| version | Source release/version or dated snapshot identifier; UNKNOWN blocks acquisition. |
| provenance | Ordered source and transformation lineage, including parent dataset IDs and tool/version details. |
| usage_notes | Specific approved purposes and interpretation notes; never rely on a generic “public” label. |
| restrictions | Explicit obligations, exclusions, attribution, share-alike, access, retention, and redistribution limits. Use an empty list only after review confirms none. |
| processing_status | State from the controlled values below. |
| quality_status | State from the controlled values below. |

## Mandatory audit fields

Every dataset also records:

- schema_version;
- rights_review_status: pending, approved, or rejected;
- approved_purposes: explicit values for internal analysis, training, evaluation, and/or redistribution; an unlisted purpose is not approved;
- license_evidence: terms URL, access date, evidence checksum or archived evidence reference, reviewer, decision, and notes;
- acquisition_method and retrieved_at, populated only after approved acquisition;
- retention_policy and deletion/takedown handling;
- privacy_review_status and quality review notes;
- file_id and content_sha256 for each acquired file;
- record_id and parent_dataset_ids for derived records;
- pipeline_version and tokenizer_id/version for processed text;
- attribution and other license obligations that must accompany downstream use.

Keep acquisition permission, training permission, evaluation permission, and redistribution permission distinct. A license or terms page must be reviewed for each intended purpose. Do not infer permission for machine-learning use from availability or from a license label alone.

## Controlled states

- processing_status: discovered, rights_review, approved, acquired, validated, normalized, quality_passed, deduplicated, ready, quarantined, rejected, failed.
- quality_status: unreviewed, passed, warning, failed.
- rights_review_status: pending, approved, rejected.
- privacy_review_status: pending, passed, restricted, rejected.

Only rights_review_status=approved may proceed to acquisition. A failed or restricted privacy review, unknown/conflicting license, missing evidence, or unresolved restriction must remain quarantined or be rejected. Record a reason for every block, rejection, or exclusion; do not silently drop a source or record.

## P0 data policy

1. No corpus payload collection before source-specific rights evidence and permitted purposes are recorded and approved by a human reviewer.
2. Public accessibility is not permission. Exclude private, login-gated, leaked, confidential, and paywalled material unless documented rights specifically permit acquisition and each intended use.
3. At P0, do not ingest sensitive personal data, personal account content, credentials, or private communications. Do not attempt to collect or retain such content for later cleanup.
4. Unknown, missing, or conflicting license/terms are blocked. Preserve attribution, notice, share-alike, and other obligations. Keep incompatible rights groups separate pending review.
5. Synthetic material must be labeled synthetic and include generator/model version, prompt/template provenance, generation date, and source lineage where applicable. Synthetic output is not automatically rights-cleared.
6. Honor source-specific retention, deletion, takedown, and redistribution limits. Keep enough provenance to identify and remove affected files and derived records.

This is an operational intake policy, not legal advice. A rights reviewer must approve each source before any content is acquired.

## Empty manifest template

The following is a schema template only. It is not an approved source or a record of collection.

~~~yaml
schema_version: 1
dataset_id: ""
source_name: ""
source_url: null
source_country: UNKNOWN
language: []
language_code: []
license: UNKNOWN
license_url: null
data_type: null
collection_date: null
version: UNKNOWN
provenance: []
usage_notes: ""
restrictions: []
processing_status: discovered
quality_status: unreviewed
rights_review_status: pending
approved_purposes: []
license_evidence: null
acquisition_method: null
retrieved_at: null
retention_policy: ""
privacy_review_status: pending
files: []
parent_dataset_ids: []
pipeline_version: null
tokenizer_id: null
~~~

## Findings: km-vocab-voa-001 (recorded 2026-10-03)

Facts only. This section is not a rights approval or a legal conclusion.

- Asset: `KHOEM_AI/src/core/ai/patterns/km-corpus-vocabulary.ts`, sha256 `b03dbf47...318f8` (matches manifest), 22,756 entries.
- History: added in `9ff150e` (23,625 tokens), cleaned in `7e822d3`. The cleanup removed 869 tokens and added 0.
- Generator: not present in this repository. The asset is not reproducible from the repo.
- Header says "punctuation removed", but `9ff150e` contained punctuation tokens. The `7e822d3` message says "digits removed", but only single-digit tokens were removed. Multi-digit Khmer-digit tokens remain.
- Hygiene tests: `KHOEM_AI/tests/km-corpus-vocabulary.test.ts` (sha256, count, no duplicates, NFC, Khmer script, no Latin/ASCII digits/whitespace/zero-width/punctuation, no single-character tokens). These are content-hygiene checks only.
- Raw VOA files (`corpus-sample/raw/voa_extracted/`) were never tracked in git. Only four synthetic fixtures are tracked under `corpus-sample/raw/`.
- No production code imports `KM_CORPUS_VOCABULARY`. It is referenced only by the test and `corpus-sample/manifest.json`.
- Gate status: `assert.mjs` confirms `mot-km-voa-001` and `km-vocab-voa-001` are blocked and nothing counts toward the target.
- Rights review: pending. `license_evidence: null`, `rights_review_status: pending`, `privacy_review_status: pending`, `approved_purposes: []`.

## Review checklist (project policy; extends schema v1)

The fields `access_date`, `evidence_sha256`, `archive_ref`, `reviewer`, `decision` are project policy enforced in `pipeline.mjs`. They are not required by schema v1 itself.

Parent (MOT / VOA):
- [ ] Official license and terms URL recorded
- [ ] Attribution requirements recorded
- [ ] Derivative / redistribution / training-use conditions reviewed
- [ ] Third-party content inside VOA items investigated
- [ ] Privacy review completed
- [ ] Evidence snapshot retained (sha256 or archive_ref), with real access date
- [ ] Human reviewer and decision recorded

Derived wordlist (`km-vocab-voa-001`):
- [ ] Generator added to the repo, or non-reproducibility accepted by reviewer
- [ ] Decision on keeping multi-digit tokens; header/commit wording corrected
- [ ] Decision on keeping the file in git while review is pending
- [ ] Attribution present in `NOTICE`
- [ ] Do not push publicly before review is complete

Do not pre-fill evidence values. Do not set `decision: approved` while any item is open.
