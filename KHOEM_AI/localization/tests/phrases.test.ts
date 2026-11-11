import test from "node:test";
import assert from "node:assert/strict";
import { PHRASE_TERMS } from "../src/lexicon/phrases.js";
import { lookupDictionary } from "../src/lexicon/dictionary.js";

test("phrases: every entry has clean English, Khmer and Chinese text", () => {
  assert.ok(PHRASE_TERMS.length >= 150);
  for (const p of PHRASE_TERMS) {
    assert.match(p.en, /[A-Za-z]/, p.id);
    assert.match(p.km, /[\u1780-\u17FF]/, p.id);
    assert.match(p.zh, /[\u3400-\u9FFF]/, p.id);
    assert.doesNotMatch(p.km, /[A-Za-z0-9]/, p.id);
    for (const v of [p.en, p.km, p.zh]) assert.equal(v, v.trim(), p.id);
  }
});

test("phrases: ids and (English, Khmer) pairs are unique", () => {
  const ids = new Set(PHRASE_TERMS.map((p) => p.id));
  assert.equal(ids.size, PHRASE_TERMS.length);
  const pairs = new Set(PHRASE_TERMS.map((p) => `${p.en}|${p.km}`));
  assert.equal(pairs.size, PHRASE_TERMS.length);
});

test("phrases: English to Khmer and Khmer to Chinese", async () => {
  const a = await lookupDictionary("Thank you", "en", "km");
  assert.ok(a.matches.some((m) => m.text === "អរគុណ" && m.source === "phrase"));
  const b = await lookupDictionary("អរគុណ", "km", "zh");
  assert.ok(b.matches.some((m) => m.text === "谢谢"));
});

test("phrases: Chinese to English and both Khmer spellings of hello", async () => {
  const a = await lookupDictionary("你好", "zh", "en");
  assert.ok(a.matches.some((m) => m.text === "Hello"));
  for (const km of ["សួស្តី", "សួស្ដី"]) {
    const r = await lookupDictionary(km, "km", "en");
    assert.ok(r.matches.some((m) => m.text === "Hello"), km);
  }
});

test("phrases: a single word translates (used by the word-by-word view)", async () => {
  const r = await lookupDictionary("កម្ពុជា", "km", "en");
  assert.ok(r.matches.some((m) => m.text === "Cambodia"));
});
