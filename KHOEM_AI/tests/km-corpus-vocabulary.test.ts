import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { KM_CORPUS_VOCABULARY as V } from "../src/core/ai/patterns/km-corpus-vocabulary";

const FILE = "src/core/ai/patterns/km-corpus-vocabulary.ts";
const SHA = "b03dbf4794dd874de62d9136bf22d72bf275916aa173e119788edc13459318f8";

describe("km-corpus-vocabulary (hygiene checks, not a rights approval)", () => {
  it("sha256 matches manifest", () =>
    expect(createHash("sha256").update(readFileSync(FILE)).digest("hex")).toBe(SHA));
  it("has 22,756 entries", () => expect(V.length).toBe(22756));
  it("no duplicates", () => expect(new Set(V).size).toBe(V.length));
  it("NFC", () => expect(V.filter((w) => w !== w.normalize("NFC"))).toEqual([]));
  it("every token has Khmer script", () =>
    expect(V.filter((w) => !/\p{Script=Khmer}/u.test(w))).toEqual([]));
  it("no Latin, ASCII digits, whitespace, zero-width, punctuation", () =>
    expect(V.filter((w) => /[A-Za-z0-9\u17E0-\u17E9\s\u200B-\u200D\uFEFF]|\p{P}/u.test(w))).toEqual([]));
  it("no single-consonant or single-digit tokens", () =>
    expect(V.filter((w) => /^[\u1780-\u17A2\u17E0-\u17E9]$/u.test(w))).toEqual([]));
});
