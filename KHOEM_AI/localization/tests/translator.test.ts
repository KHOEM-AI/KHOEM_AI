import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getTranslation, getTranslationDetailed, createTranslator, hasTranslation,
  clearCache, clearLocaleCache, KhoemError,
} from "../src/index.js";
import { cacheStats } from "../src/core/cache.js";
import { loadLocale } from "../src/core/loader.js";

test("Unicode: Khmer text is intact", async () => {
  assert.equal(await getTranslation("km", "common.save"), "រក្សាទុក");
  assert.equal(await getTranslation("km-KH", "navigation.home"), "ទំព័រដើម");
});
test("interpolation", async () => {
  assert.equal(await getTranslation("en", "welcome.user", { name: "KHOEM" }), "Hello, KHOEM");
  assert.equal(await getTranslation("km", "welcome.user", { name: "KHOEM" }), "សួស្តី KHOEM");
});
test("plurals via Intl.PluralRules", async () => {
  assert.equal(await getTranslation("en", "common.items", { count: 1 }), "1 item");
  assert.equal(await getTranslation("en", "common.items", { count: 5 }), "5 items");
  assert.equal(await getTranslation("km", "common.items", { count: 1 }), "1 ធាតុ");
  await assert.rejects(getTranslation("en", "common.items"), (e: unknown) => e instanceof KhoemError && e.code === "INVALID_PARAMETERS");
});
test("unregistered-data locale falls back to en and reports it", async () => {
  const r = await getTranslationDetailed("af", "common.save");
  assert.equal(r.text, "Save");
  assert.equal(r.fallbackUsed, true);
  assert.equal(r.resolvedLocale, null);
  assert.equal(await hasTranslation("af", "common.save"), false);
});
test("missing key: returns key, calls onMissing, strict throws", async () => {
  let seen = "";
  const t = await getTranslation("en", "common.nope", undefined, { onMissing: (i) => { seen = i.key; } });
  assert.equal(t, "common.nope");
  assert.equal(seen, "common.nope");
  await assert.rejects(getTranslation("en", "common.nope", undefined, { strict: true }),
    (e: unknown) => e instanceof KhoemError && e.code === "TRANSLATION_NOT_FOUND");
});
test("invalid input", async () => {
  await assert.rejects(getTranslation("!!", "common.save"), (e: unknown) => e instanceof KhoemError && e.code === "INVALID_LOCALE");
  await assert.rejects(getTranslation("en", "../../etc/passwd"), (e: unknown) => e instanceof KhoemError && e.code === "INVALID_TRANSLATION_KEY");
  await assert.rejects(getTranslation("en", "__proto__"), (e: unknown) => e instanceof KhoemError && e.code === "INVALID_TRANSLATION_KEY");
  assert.equal(await hasTranslation("en", "constructor"), false);
});
test("createTranslator sync t()", async () => {
  const tr = await createTranslator("km");
  assert.equal(tr.t("common.cancel"), "បោះបង់");
  assert.equal(tr.resolvedLocale, "km");
});
test("loader: unregistered and unavailable locales", async () => {
  await assert.rejects(loadLocale("xx-ZZ"), (e: unknown) => e instanceof KhoemError && e.code === "UNSUPPORTED_LOCALE");
  await assert.rejects(loadLocale("af"), (e: unknown) => e instanceof KhoemError && e.code === "LOCALE_NOT_FOUND");
  await assert.rejects(loadLocale("///"), (e: unknown) => e instanceof KhoemError && e.code === "INVALID_LOCALE");
});
test("cache hit / miss / invalidate / clear", async () => {
  clearCache();
  await loadLocale("en"); assert.equal(cacheStats.misses, 1);
  await loadLocale("en"); assert.equal(cacheStats.hits, 1);
  clearLocaleCache("en");
  await loadLocale("en"); assert.equal(cacheStats.misses, 2);
  clearCache();
  assert.equal(cacheStats.hits + cacheStats.misses, 0);
});
