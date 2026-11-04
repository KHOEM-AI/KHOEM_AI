import test from "node:test";
import assert from "node:assert/strict";
import { analyzeKhmer } from "../src/lexicon/khmerWords.js";

test("khmer-words: a common word is known", async () => {
  const r = await analyzeKhmer("បាន", "en");
  assert.equal(r.tokens.length, 1);
  assert.equal(r.tokens[0]?.known, true);
});

test("khmer-words: a color name gets a translation", async () => {
  const r = await analyzeKhmer("ក្រហម", "en");
  assert.equal(r.tokens[0]?.translation, "Red");
  const z = await analyzeKhmer("ក្រហម", "zh");
  assert.equal(z.tokens[0]?.translation, "红色");
});

test("khmer-words: repeated letters are not words", async () => {
  const r = await analyzeKhmer("ឆឆឆឆឆឆ", "en");
  assert.equal(r.known, 0);
  assert.equal(r.translated, 0);
});

test("khmer-words: a single consonant is a letter, not a known word", async () => {
  const r = await analyzeKhmer("ឆ", "en");
  assert.equal(r.tokens[0]?.known, false);
});

test("khmer-words: a sentence is cut into known words", async () => {
  const r = await analyzeKhmer("ខ្ញុំស្រលាញ់ប្រទេសកម្ពុជា", "en");
  assert.ok(r.tokens.length >= 3);
  assert.ok(r.known >= 3);
});

test("khmer-words: Latin text is ignored", async () => {
  const r = await analyzeKhmer("hello", "en");
  assert.equal(r.tokens.length, 0);
});

test("khmer-words: unsupported target is rejected", async () => {
  await assert.rejects(() => analyzeKhmer("បាន", "km"));
});
