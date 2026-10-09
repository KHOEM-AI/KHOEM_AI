import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const PL = new Set(["zero", "one", "two", "few", "many", "other"]);
const isLeaf = (v) => typeof v === "string" || (v && typeof v === "object" && Object.keys(v).length && Object.keys(v).every((k) => PL.has(k) && typeof v[k] === "string"));
const flat = (t, p = "", o = {}) => { for (const [k, v] of Object.entries(t || {})) { const key = p ? `${p}.${k}` : k; isLeaf(v) ? (o[key] = v) : flat(v, key, o); } return o; };
const nest = (f) => { const o = {}; for (const [k, v] of Object.entries(f)) { const ps = k.split("."); let c = o; ps.slice(0, -1).forEach((x) => (c = c[x] ??= {})); c[ps.at(-1)] = v; } return o; };
const mode = process.argv[2] || "scan";
const { LOCALE_LOADERS } = await imp("dist/src/locales/index.js");
const { LANGUAGES } = await imp("dist/src/registry/languages.js");
const { loadLocale } = await imp("dist/src/core/loader.js");
const LL = async (id) => { try { return await loadLocale(id); } catch { return {}; } };
const en = await LL("en");
const km = await LL("km");
const ids = LANGUAGES.map((l) => l.languageId).filter((i) => i !== "en" && i !== "km");
const todoDir = path.join(root, "translations-todo"), doneDir = path.join(root, "translations-done");
fs.mkdirSync(todoDir, { recursive: true }); fs.mkdirSync(doneDir, { recursive: true });

if (mode === "scan") {
  let total = 0;
  for (const id of ids) {
    const cur = await LL(id);
    const miss = {};
    for (const k of Object.keys(en)) if (!(k in cur) || cur[k] === "") miss[k] = { en: en[k], km: km[k] ?? "" };
    total += Object.keys(miss).length;
    if (Object.keys(miss).length) fs.writeFileSync(path.join(todoDir, `${id}.json`), JSON.stringify(miss, null, 1));
    else { const f = path.join(todoDir, `${id}.json`); if (fs.existsSync(f)) fs.unlinkSync(f); }
    console.log(id.padEnd(5), String(Object.keys(miss).length).padStart(4), "missing");
  }
  console.log("TOTAL missing:", total, "->", todoDir);
}

if (mode === "apply") {
  const idxFile = path.join(root, "src/locales/index.ts");
  let idx = fs.readFileSync(idxFile, "utf8");
  for (const f of fs.readdirSync(doneDir).filter((x) => x.endsWith(".json"))) {
    const id = f.replace(".json", "");
    if (!ids.includes(id)) { console.log("SKIP unknown", id); continue; }
    const done = JSON.parse(fs.readFileSync(path.join(doneDir, f), "utf8"));
    const bad = Object.keys(done).filter((k) => !(k in en));
    if (bad.length) { console.log("SKIP", id, "unknown keys:", bad.slice(0, 3)); continue; }
    const ph = (s) => [...new Set(JSON.stringify(s).match(/\{\{[^}]+\}\}/g) || [])].sort().join();
    const badPh = Object.keys(done).filter((k) => ph(done[k]) !== ph(en[k]));
    if (badPh.length) { console.log("SKIP", id, "placeholder mismatch:", badPh.slice(0, 3)); continue; }
    const dir = path.join(root, "src/locales", id);
    fs.mkdirSync(dir, { recursive: true });
    const fillFile = path.join(dir, "fill.ts");
    const prev = fs.existsSync(fillFile) ? flat((await imp(`dist/src/locales/${id}/fill.js`).catch(() => ({ default: {} }))).default) : {};
    fs.writeFileSync(fillFile, `import type { TranslationTree } from "../../types/index.js";\n\nconst fill: TranslationTree = ${JSON.stringify(nest({ ...prev, ...done }), null, 2)};\n\nexport default fill;\n`);
    const idxLocal = path.join(dir, "index.ts");
    const hasApp = fs.existsSync(path.join(dir, "app.ts"));
    const cur = fs.existsSync(idxLocal) ? fs.readFileSync(idxLocal, "utf8") : "";
    if (!cur || /^import app from "\.\/app\.js";\s*export default app;\s*$/.test(cur) || cur.includes("./fill.js") === false && !cur) {
      const body = `import type { TranslationTree } from "../../types/index.js";\n${hasApp ? 'import app from "./app.js";\n' : ""}import fill from "./fill.js";\n\nconst merge = (a: TranslationTree, b: TranslationTree): TranslationTree => {\n  const o: Record<string, unknown> = { ...a };\n  for (const [k, v] of Object.entries(b)) {\n    const x = o[k];\n    o[k] = x && typeof x === "object" && typeof v === "object" && !Array.isArray(v) ? merge(x as TranslationTree, v as TranslationTree) : v;\n  }\n  return o as TranslationTree;\n};\n\nexport default merge(${hasApp ? "app" : "{}"}, fill);\n`;
      fs.writeFileSync(idxLocal, body);
    } else if (!cur.includes("./fill.js")) { console.log("MANUAL index.ts for", id); continue; }
    if (!new RegExp(`^\\s+${id}:`, "m").test(idx)) idx = idx.replace(/\n};/, `\n  ${id}: () => import("./${id}/index.js"),\n};`);
    console.log("APPLIED", id, Object.keys(done).length);
  }
  fs.writeFileSync(idxFile, idx);
}
