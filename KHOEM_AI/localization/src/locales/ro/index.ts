import type { TranslationTree } from "../../types/index.js";
import app from "./app.js";
import fill from "./fill.js";

const merge = (a: TranslationTree, b: TranslationTree): TranslationTree => {
  const o: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const x = o[k];
    o[k] = x && typeof x === "object" && typeof v === "object" && !Array.isArray(v) ? merge(x as TranslationTree, v as TranslationTree) : v;
  }
  return o as TranslationTree;
};

export default merge(app, fill);
