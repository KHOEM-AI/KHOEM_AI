import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveLocale as resolveIn, canonicalizeLocale } from "../src/core/resolver.js";
import { buildFallbackChain } from "../src/core/fallback.js";
import { resolveLocale } from "../src/index.js";

test("exact / language / region fallback", () => {
  assert.equal(resolveIn("en", ["en", "en-GB"]), "en");
  assert.equal(resolveIn("en-US", ["en", "en-GB"]), "en");
  assert.equal(resolveIn("km-KH", ["km"]), "km");
  assert.equal(resolveIn("en-GB", ["en", "en-GB"]), "en-GB");
});
test("script fallback chain is generated from structure", () => {
  assert.deepEqual(buildFallbackChain("zh-Hant-TW"), ["zh-Hant-TW", "zh-TW", "zh-Hant", "zh"]);
  assert.deepEqual(buildFallbackChain("zh-TW"), ["zh-TW", "zh-Hant-TW", "zh-Hant", "zh"]);
  assert.equal(resolveIn("zh-TW", ["zh", "zh-Hant"]), "zh-Hant");
});
test("never picks an unrelated language", () => {
  assert.equal(resolveIn("fr-FR", ["en", "km"]), null);
  assert.equal(resolveLocale("ar"), null);
});
test("invalid locale does not crash", () => {
  for (const bad of ["", "!!!", "en--US", "x".repeat(200)]) {
    assert.equal(canonicalizeLocale(bad), null);
    assert.equal(resolveIn(bad, ["en"]), null);
  }
  assert.equal(canonicalizeLocale("en_us"), "en-US");
});
