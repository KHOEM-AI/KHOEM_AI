#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node corpus-sample/pipeline.mjs > /dev/null
node corpus-sample/assert.mjs
node corpus-sample/gates-test.mjs
