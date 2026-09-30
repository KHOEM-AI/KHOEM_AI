import { test } from "node:test";
import assert from "node:assert/strict";
import { listLanguages, listLocales, getLanguage, getLocale, getLocaleDirection, KhoemError } from "../src/index.js";
import { REGIONS } from "../src/registry/regions.js";

test("60-language foundation with unique codes", () => {
  const langs = listLanguages();
  assert.equal(langs.length, 60);
  assert.equal(new Set(langs.map((l) => l.languageId)).size, 60);
  assert.equal(new Set(langs.map((l) => l.iso639_3)).size, 60);
});
test("locales unique and canonical", () => {
  const ids = listLocales().map((l) => l.locale);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.equal(Intl.getCanonicalLocales(id)[0], id);
});
test("region codes unique", () => {
  assert.equal(new Set(REGIONS.map((r) => r.code)).size, REGIONS.length);
});
test("lookup errors are structured", () => {
  assert.throws(() => getLanguage("xx"), (e: unknown) => e instanceof KhoemError && e.code === "LANGUAGE_NOT_FOUND");
  assert.throws(() => getLocale("xx-YY"), (e: unknown) => e instanceof KhoemError && e.code === "LOCALE_NOT_FOUND");
});
test("RTL direction", () => {
  for (const l of ["ar", "he", "fa", "ur", "ar-SA"]) assert.equal(getLocaleDirection(l), "rtl");
  assert.equal(getLocaleDirection("km"), "ltr");
  assert.equal(getLocaleDirection("not a locale"), "ltr");
});
