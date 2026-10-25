import fs from "node:fs";
const letter = process.argv[2];
if (!letter) { console.log("ប្រើ: node letter-filter.mjs ក"); process.exit(1); }
const brain = fs.readFileSync(process.env.HOME + "/ai-project/AI/src/ai/khmer.mjs", "utf8");
const rows = fs.readFileSync("km_vocab_candidates.tsv", "utf8").split("\n").map(l => l.split("\t"));
const khmerOnly = /^[\u1780-\u17FF]+$/;
const ok = rows.filter(([w, n]) => w && khmerOnly.test(w) && w.startsWith(letter) && w.length >= 2 && Number(n) >= 20 && !w.endsWith("\u17D2"));
const need = ok.filter(([w]) => !brain.includes(w));
fs.writeFileSync(`letter-${letter}-need.txt`, need.map(r => r[0]).join("\n"));
console.log(letter, "ស្អាត:", ok.length, "| ខ្វះ:", need.length);
console.log(need.slice(0, 100).map(r => r[0]).join(" "));
