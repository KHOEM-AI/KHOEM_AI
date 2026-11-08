#!/usr/bin/env node
// clean-boilerplate.mjs: remove 2 known filler paragraphs from src/khmer/data.extra2.1.ts
// Run in KHOEM_AI/localization:  node tools/clean-boilerplate.mjs          (dry-run)
//                                node tools/clean-boilerplate.mjs --write  (apply)
import fs from "node:fs";
const file = "src/khmer/data.extra2.1.ts";
const P = [
  "\\n\\nដើម្បីឱ្យច្បាស់៖ បំបែកប្រធានបទនេះជាគោលបំណង ជំហានដែលត្រូវធ្វើ និងលទ្ធផលដែលចង់បាន។ បើមានទីតាំង ម៉ូដែល កាលបរិច្ឆេទ ឬករណីជាក់លាក់ សូមបញ្ជាក់ ដើម្បីឱ្យចម្លើយត្រូវនឹងស្ថានភាពជាងមុន។",
  "\\n\\nសម្រាប់ការរៀន៖ ចាប់ផ្តើមពីគោលដៅតូចមួយ អនុវត្តជាប្រចាំ ហើយពិនិត្យអ្វីដែលនៅមិនទាន់យល់។ ឧទាហរណ៍ អនុវត្តមួយជំហាន សាកល្បងដោយខ្លួនឯង រួចកែតាមមតិកែលម្អ។",
];
let s = fs.readFileSync(file, "utf8"), out = s;
for (const p of P) { const n = out.split(p).length - 1; console.log(`found ${n}×: ${p.slice(4, 30)}…`); out = out.split(p).join(""); }
const keys = (t) => (t.match(/\["[^"]+",/g) || []).length;
console.log(`entries before: ${keys(s)}  after: ${keys(out)}  bytes ${s.length} -> ${out.length}`);
if (keys(s) !== keys(out)) { console.error("entry count changed, abort"); process.exit(1); }
if (process.argv.includes("--write")) { fs.writeFileSync(file, out); console.log("written. Now: npm run verify"); } else console.log("dry-run only. Add --write to apply.");
