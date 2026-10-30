import test from "node:test";
import assert from "node:assert/strict";
import { lookupDictionary } from "../src/lexicon/dictionary.js";

test("dictionary: UI phrase en to km", async () => {
  const r = await lookupDictionary("Save", "en", "km");
  assert.equal(r.found, true);
  assert.ok(r.matches.some((m) => m.text === "រក្សាទុក"));
});

test("dictionary: UI phrase zh to en", async () => {
  const r = await lookupDictionary("保存", "zh", "en");
  assert.ok(r.matches.some((m) => m.text === "Save"));
});

test("dictionary: color en to km and km to zh", async () => {
  const a = await lookupDictionary("Red", "en", "km");
  assert.ok(a.matches.some((m) => m.text === "ក្រហម"));
  const b = await lookupDictionary("ក្រហម", "km", "zh");
  assert.ok(b.matches.some((m) => m.text === "红色"));
});

test("dictionary: missing Khmer name is reported, not invented", async () => {
  const r = await lookupDictionary("Coral", "en", "km");
  assert.equal(r.found, true);
  assert.ok(r.matches.some((m) => m.missing));
});

test("dictionary: unknown word is not found", async () => {
  const r = await lookupDictionary("zzzqqqxxx", "en", "km");
  assert.equal(r.found, false);
});

test("dictionary: unsupported language is rejected", async () => {
  await assert.rejects(() => lookupDictionary("Save", "en", "fr"));
});
