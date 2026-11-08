import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KHMER_PARTS, KHMER_ALL_ENTRIES } from "../src/khmer/levels/index.js";
import { normKhmer } from "../src/khmer/norm.js";

// The tools in tools/ are plain .mjs files that read the TypeScript source in src/khmer/levels.
// These tests keep the shared helper (tools/lib/khmer-levels.mjs) in step with the real data and with norm.ts.
// Tests run from KHOEM_AI/localization (npm test), so paths are relative to the current directory.
type Entry = [string, string];
interface Part { level: 1 | 2 | 3; name: string; file: string; entries: Entry[] }
interface Helper {
  norm(s: string): string;
  levelsDir(): string;
  loadParts(dir: string): Part[];
  partText(level: number, nnn: string, entries: Entry[]): string;
  indexText(parts: Part[]): string;
  MAX_ENTRIES: number;
  MAX_BYTES: number;
  entryBytes(entries: Entry[]): number;
}
const helper = (await import(pathToFileURL(path.resolve("tools/lib/khmer-levels.mjs")).href)) as Helper;
const dir = helper.levelsDir();
const parts = helper.loadParts(dir);

test("khmer tools: helper norm() equals normKhmer() from src/khmer/norm.ts", () => {
  const samples = ["  ក​ខ?  ", "ឲ្យ។", "Hello   World!", "ស្ដី៖", "á", "﻿គ  ឃ"];
  for (const s of samples) assert.equal(helper.norm(s), normKhmer(s), JSON.stringify(s));
});

test("khmer tools: the helper reads exactly the entries the program uses", () => {
  assert.deepEqual(parts.map((p) => p.name), KHMER_PARTS.map((p) => p.name));
  assert.deepEqual(parts.flatMap((p) => p.entries), KHMER_ALL_ENTRIES);
});

test("khmer tools: part files, index.ts and ORIGIN.tsv are exactly what the generator would write", () => {
  for (const p of parts) {
    const nnn = /part-(\d{3})$/.exec(p.name)?.[1];
    assert.ok(nnn, p.name);
    assert.equal(fs.readFileSync(p.file, "utf8"), helper.partText(p.level, nnn, p.entries), p.name);
    assert.ok(p.entries.length <= helper.MAX_ENTRIES, p.name + " has too many entries");
    assert.ok(helper.entryBytes(p.entries) <= helper.MAX_BYTES, p.name + " is too big");
  }
  assert.equal(fs.readFileSync(path.join(dir, "index.ts"), "utf8"), helper.indexText(parts));
  const origin = fs.readFileSync(path.join(dir, "ORIGIN.tsv"), "utf8").split("\n").filter(Boolean);
  assert.equal(origin.length - 1, KHMER_ALL_ENTRIES.length, "ORIGIN.tsv needs one row per entry");
});

test("khmer tools: README table matches the part files", () => {
  const readme = fs.readFileSync(path.join(dir, "README.md"), "utf8");
  for (const lv of [1, 2, 3] as const) {
    const lvParts = parts.filter((p) => p.level === lv);
    const n = lvParts.reduce((a, p) => a + p.entries.length, 0);
    const bytes = lvParts.reduce((a, p) => a + fs.statSync(p.file).size, 0);
    const row = new RegExp(`^\\| ${lv} \\| [^|]*\\| ${lvParts.length} \\| ${n} \\| ${bytes} \\|$`, "m");
    assert.match(readme, row, `README row for level ${lv}`);
  }
});
