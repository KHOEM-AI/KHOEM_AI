import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLanguageHub, getHubEntry, listLanguages } from "../src/index.js";

test("hub has one entry per registered language", async () => {
  const hub = await buildLanguageHub();
  assert.equal(hub.length, listLanguages().length);
});
test("hub entry for km joins locales, regions and coverage", async () => {
  const km = await getHubEntry("km");
  assert.ok(km);
  assert.equal(km.language.languageId, "km");
  assert.ok(km.locales.some((l) => l.locale === "km-KH"));
  assert.equal(km.coveragePercent, 100);
});
test("hub returns null for unknown language", async () => {
  assert.equal(await getHubEntry("xx"), null);
});
