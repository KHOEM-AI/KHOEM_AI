# Data Source Allowlist

**Purpose:** Human-review template only. This file contains no real source or dataset entries and approves no collection. Do not add a source until supporting evidence is recorded and a human rights/privacy reviewer has completed the review.

## Review rules

- Assess the license and the privacy/data-transfer basis separately. An open license does not by itself authorize cross-border transfer or satisfy privacy requirements.
- Review commercial use, modification, redistribution, attribution, privacy/personal-data status, and cross-border transfer as separate decisions. Do not infer one permission from another.
- Keep evidence for every decision. Missing, unclear, conflicting, or unverified evidence must not result in approval.
- Do not download or collect any dataset while a record is pending, needs_review, restricted for the intended activity, or otherwise lacks the required approvals. This template does not authorize collection.
- Use one record per source/dataset and version when rights, terms, location, or processing differ. Link derived datasets to their parent provenance.

## Decision statuses

| Status | Meaning |
| --- | --- |
| pending | Candidate has not completed review. No collection. |
| approved | A named human reviewer verified evidence and approved the stated purposes and conditions. Approval is limited to the recorded scope. |
| rejected | Evidence or rights do not permit the proposed use. Do not collect or use. |
| restricted | Some limited activity may be permitted, but only within documented restrictions; no activity outside that scope. |
| needs_review | Evidence is incomplete, ambiguous, conflicting, or requires specialist review. No collection. |

## Blank source record template

Copy this block only when a real candidate is proposed. Empty values are intentional; they are not evidence and do not represent a real source. Keep decision blank until a human reviewer records a decision.

~~~yaml
source_id: ""
dataset_source_name: "" # dataset/source name
provider: ""
country_or_region: ""
language: ""
language_code: ""
data_type: "" # native | parallel | instruction | dialogue | knowledge | synthetic
source_url: ""
license: ""
license_url: ""
commercial_use: "" # permitted | prohibited | conditional | unknown | not_reviewed
modification_allowed: "" # permitted | prohibited | conditional | unknown | not_reviewed
redistribution_allowed: "" # permitted | prohibited | conditional | unknown | not_reviewed
attribution_required: "" # yes | no | conditional | unknown | not_reviewed
privacy_or_personal_data_status: "" # reviewed status and basis; never assume none
cross_border_transfer_status: "" # permitted | prohibited | conditional | unknown | not_reviewed
collection_method: "" # proposed method only; do not execute before approval
provenance: []
evidence: [] # terms/license, privacy basis, transfer basis, and supporting records
reviewer: ""
review_date: null # YYYY-MM-DD; set only when reviewed

decision: "" # pending | approved | rejected | restricted | needs_review
notes: ""
~~~

## Evidence and review requirements

For a real candidate, evidence must identify the source and the exact version/terms reviewed. Record durable URLs or archived references, capture date, and a checksum or equivalent integrity reference where available. Attach separate evidence for:

1. license and terms, including permission for each proposed use;
2. privacy/personal-data status and applicable basis or restrictions;
3. cross-border transfer status, destination scope, and any conditions;
4. source provenance, provider, collection method, and dataset version.

The reviewer must enter their name or role, review date, decision, and conditions in notes. If privacy or cross-border transfer is unknown, do not mark it permitted. If the license is open but transfer/privacy review is incomplete, keep the record pending or needs_review; do not approve transfer or collection by implication.

No source has been entered, approved, downloaded, or collected in this template-only change. No ingestion code is included.
