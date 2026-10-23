import test from "node:test";
import assert from "node:assert/strict";
import {
  searchKhmer,
  searchKhmerExact,
} from "../src/khmer/search.js";

test("Khmer search: exact and normalized queries", () => {
  const expected = searchKhmerExact("លេខសង្គ្រោះបន្ទាន់");
  assert.ok(expected);
  assert.equal(searchKhmer("លេខសង្គ្រោះបន្ទាន់"), expected);
  assert.equal(searchKhmer("  លេខសង្គ្រោះបន្ទាន់  "), expected);
  assert.equal(searchKhmer("លេខសង្គ្រោះបន្ទាន់?"), expected);
});

test("Khmer search: emergency aliases return expected answers", () => {
  assert.ok(searchKhmer("ហៅរថយន្តពន្លត់អគ្គិភ័យ")?.includes("118"));
  assert.ok(searchKhmer("ហៅរថយន្តសង្គ្រោះបន្ទាន់")?.includes("119"));
});

test("Khmer exact search never guesses", () => {
  for (const q of [
    "",
    "សំណួរមិនស្គាល់ទាំងស្រុង",
    "លេខសង្គ្រោះបន្ទាន់ខុសឆ្ងាយ",
  ]) {
    assert.equal(searchKhmerExact(q), null, q);
  }
});

test("Khmer smart search rejects unknown and short queries", () => {
  assert.equal(searchKhmer(""), null);
  assert.equal(searchKhmer("abc"), null);
  assert.equal(searchKhmer("សំណួរមិនស្គាល់ទាំងស្រុង"), null);
});
