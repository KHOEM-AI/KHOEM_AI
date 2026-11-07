import test from "node:test";
import assert from "node:assert/strict";
import { KHMER_PARTS, KHMER_ALL_ENTRIES } from "../src/khmer/levels/index.js";
import { normKhmer, foldKhmer } from "../src/khmer/norm.js";
import { searchKhmerExact } from "../src/khmer/search.js";

test("khmer levels: every part is within 1000 entries and levels are 1..3", () => {
  assert.ok(KHMER_PARTS.length > 0);
  for (const p of KHMER_PARTS) {
    assert.ok(p.entries.length > 0 && p.entries.length <= 1000, p.name);
    assert.ok([1, 2, 3].includes(p.level), p.name);
  }
});

test("khmer levels: no empty keys or answers, and no two entries share a normalized key", () => {
  const seen = new Set<string>();
  for (const [keys, answer] of KHMER_ALL_ENTRIES) {
    assert.ok(answer.trim().length > 0, keys);
    for (const alias of keys.split("|")) {
      const n = normKhmer(alias);
      if (!n) continue;
      assert.ok(!seen.has(n), "duplicate key: " + n);
      seen.add(n);
    }
  }
});

test("normKhmer ignores zero-width characters; foldKhmer matches spelling variants", () => {
  assert.equal(normKhmer("ក\u200Bខ"), normKhmer("កខ"));
  assert.equal(foldKhmer("ឲ្យ"), foldKhmer("ឱ្យ"));
  assert.equal(foldKhmer("ស្ដី"), foldKhmer("ស្តី"));
  assert.notEqual(normKhmer("ស្ដី"), normKhmer("ស្តី"));
});

test("khmer search: a query with a zero-width character still finds the entry", () => {
  const [keys, answer] = KHMER_ALL_ENTRIES[0]!;
  const chars = Array.from(keys.split("|")[0]!);
  assert.equal(searchKhmerExact(chars[0]! + "\u200B" + chars.slice(1).join("")), answer);
});
