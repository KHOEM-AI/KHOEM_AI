diff --git a/research/HUMAN_REVIEW_CHECKLIST.md b/research/HUMAN_REVIEW_CHECKLIST.md
new file mode 100644
index 0000000..f05894c
--- /dev/null
+++ b/research/HUMAN_REVIEW_CHECKLIST.md
@@ -0,0 +1,50 @@
+# KHOEM_AI — Human Rights Review Checklist
+
+**Scope:** Review only. This worksheet does not grant permission to use a source.  
+**Current evidence:** `research/rights-gated-shortlist.md` and the captured evidence under `research/sources/`.  
+**Rule:** Keep the checkboxes blank until a human reviewer has examined and recorded the supporting evidence. A missing or unclear critical gate stays `NEEDS_REVIEW`; it does not advance.
+
+## Source-by-source checklist
+
+| Source family | Existing shortlist status | Rights / license scope | Process, retain & redistribute | Privacy / PII | Cross-border | Provenance | Scope, volume & counting | Attribution / share-alike | Human decision, reviewer & date |
+|---|---|---|---|---|---|---|---|---|---|
+| Cambodian Criminal Procedure Code resource | CANDIDATE | ☐ Verify license covers the exact bilingual resource and government-origin text | ☐ Confirm intended processing, retention and redistribution rights | ☐ Inspect exact file for personal data | ☐ Assess KHOEM_AI transfer path | ☐ Verify authoritative edition and translation provenance | ☐ Count usable Khmer/English words with KHOEM_AI rule | ☐ Record CC BY-SA obligations if applicable | ____________________ |
+| FLORES-200 | CANDIDATE — evaluation only | ☐ Verify CC BY-SA 4.0 scope for selected version and use | ☐ Confirm evaluation/reference use and any redistribution conditions | ☐ Check corpus-specific privacy evidence | ☐ Assess KHOEM_AI transfer path | ☐ Pin benchmark version and translation provenance | ☐ Keep evaluation text separate; measure only under a defined rule | ☐ Document attribution and share-alike obligations | ____________________ |
+| Project Gutenberg | CANDIDATE — title by title | ☐ Verify copyright and license for every selected title/edition and jurisdiction | ☐ Confirm commercial use, processing, retention and redistribution per title | ☐ Check selected texts for personal data | ☐ Assess KHOEM_AI transfer path | ☐ Preserve title, edition and source metadata | ☐ Count only titles passing language, rights and quality filters | ☐ Record title-specific attribution/license conditions | ____________________ |
+| Tatoeba sentence export | CANDIDATE — sentence by sentence | ☐ Verify each selected sentence’s license metadata | ☐ Confirm processing, retention and redistribution conditions for each license | ☐ Check exported text for personal data | ☐ Assess downstream storage and transfer | ☐ Preserve sentence ID, contributor/license metadata and export version | ☐ Verify Khmer coverage; calculate post-filter retained count | ☐ Preserve attribution and CC BY 2.0 FR / CC0 distinctions | ____________________ |
+| Wikimedia public text dumps | CANDIDATE — selected content only | ☐ Verify page, project, namespace and revision license exceptions | ☐ Confirm the intended use under each applicable license | ☐ Review biographies, personal data and deletion/removal handling | ☐ Assess KHOEM_AI transfer path | ☐ Preserve wiki, page/revision IDs and snapshot provenance | ☐ Measure selected pages with the project’s counting rule | ☐ Operationalize attribution and share-alike obligations | ____________________ |
+| FineWeb2 | NEEDS_REVIEW | ☐ Verify ODC-By 1.0 scope and underlying page rights | ☐ Confirm rights to process, retain and redistribute derived text | ☐ Review residual PII, sensitive data and opt-out handling | ☐ Assess KHOEM_AI transfer path | ☐ Pin release and document/source provenance requirements | ☐ Establish post-rights-filter Khmer and total retained counts | ☐ Define attribution obligations and how they will be met | ____________________ |
+| MADLAD-400 | NEEDS_REVIEW | ☐ Verify CC BY 4.0 scope and underlying Common Crawl page rights | ☐ Confirm rights for the exact clean/noisy release and intended use | ☐ Review residual PII and limits of the audit evidence | ☐ Assess KHOEM_AI transfer path | ☐ Pin release, document/sentence form and source traceability | ☐ Establish language-specific retained counts with KHOEM_AI rule | ☐ Define and operationalize attribution obligations | ____________________ |
+| Common Crawl raw archive | REJECT under current evidence | ☐ Blanket rights for crawled pages not established | ☐ Do not use as direct intake on current evidence | ☐ Determine page-level privacy and removal controls before any reconsideration | ☐ Assess KHOEM_AI transfer path | ☐ Specify page/source traceability and removal propagation | ☐ Raw archive size is not a usable token estimate | ☐ No blanket permission identified | ____________________ |
+
+## Critical gates
+
+Record evidence or a reviewer note for every gate before changing a source’s human disposition:
+
+1. **Right to use:** Primary evidence identifies the license/rights and covers the exact content selected.
+2. **Processing and retention:** Evidence supports the intended processing, retention of derived text, and any redistribution by KHOEM_AI.
+3. **Privacy / PII:** A documented procedure addresses personal and sensitive data, opt-outs, removal requests, and any voice data if relevant.
+4. **Cross-border:** The intended controller, storage, vendor and destination jurisdictions have been reviewed; no unresolved transfer restriction is being assumed away.
+5. **Provenance:** The trace can be followed from dataset to selected subset to document/record to processed output.
+6. **Attribution / share-alike:** All applicable obligations are recorded and have an operational way to be fulfilled.
+7. **Counting rule:** The retained amount can be measured with KHOEM_AI’s defined tokenizer/word-segmentation rule and language allocation.
+8. **Named human sign-off:** A responsible reviewer records the decision, evidence, date and any conditions before a separate decision about later repository or data actions.
+
+## Disposition flow
+
+`DISCOVERED → CANDIDATE → NEEDS_REVIEW → HUMAN_SIGNED_OFF → ELIGIBLE_FOR_ALLOWLIST_REVIEW → ALLOWLISTED → DOWNLOADED → INGESTED`
+
+`REJECT → STOP`
+
+Human sign-off is a separate gate; it does not automatically change an allowlist or authorize a download or ingestion. No download, ingestion, allowlist edit, vocabulary edit, code change, or source-record creation is part of this checklist task.
+
+## Review record
+
+- **Reviewer:** ____________________
+- **Date:** ____________________
+- **Source / exact release or records reviewed:** ____________________
+- **Evidence links or file paths:** ____________________
+- **Human disposition:** `CANDIDATE` / `NEEDS_REVIEW` / `REJECT`
+- **Conditions, unresolved questions, or rationale:**  
+  ____________________________________________________________________  
+  ____________________________________________________________________
\ No newline at end of file

