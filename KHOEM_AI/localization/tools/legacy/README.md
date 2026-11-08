# tools/legacy

One-off tools from the time Khmer data lived in `src/khmer/data*.ts`. They were used for the old layout and are kept for history only.
They no longer work with `src/khmer/levels/` and must not be run on the current data:

- `clean-boilerplate.mjs`
- `split-data.mjs`
- `prune-shadowed.mjs`

Current tools: see `../` (`check-new-entries.mjs`, `replace-answers.mjs`, `export-khmer.mjs`, `verify-levels.mjs`, ...) and `docs/KHMER_KNOWLEDGE.md`.
