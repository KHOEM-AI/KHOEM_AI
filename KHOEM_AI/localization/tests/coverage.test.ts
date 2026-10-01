import { test } from "node:test";
import assert from "node:assert/strict";
import { getTranslationCoverage } from "../src/index.js";
import { extractPlaceholders } from "../src/core/translator.js";

test("English source is 100% and complete", async () => {
  const c = await getTranslationCoverage("en");
  assert.equal(c.coverage, 100);
  assert.equal(c.computedStatus, "complete");
});
test("Khmer coverage is computed, and declared status stays draft", async () => {
  const c = await getTranslationCoverage("km");
  assert.equal(c.missing.length, 0);
  assert.equal(c.placeholderMismatch.length, 0);
  assert.equal(c.declaredStatus, "draft");
});
test("placeholder detection", () => {
  assert.deepEqual(extractPlaceholders("Hello {{name}} {{ name }} {{age}}"), ["age", "name"]);
  assert.notDeepEqual(extractPlaceholders("Hello {{name}}"), extractPlaceholders("សួស្តី {{user}}"));
});
