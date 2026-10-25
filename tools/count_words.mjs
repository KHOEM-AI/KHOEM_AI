import readline from 'node:readline';
const seg = new Intl.Segmenter('km', { granularity: 'word' });
const KH = /[\u1780-\u17FF]/g;
const limit = Number(process.argv[2] || 0);
let words = 0, chars = 0, lines = 0;
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  for (const s of seg.segment(line)) if (s.isWordLike) words++;
  chars += (line.match(KH) || []).length;
  lines++;
  if (limit && lines >= limit) rl.close();
});
rl.on('close', () => {
  console.log(`lines=${lines} words=${words} khmer_chars=${chars} chars_per_word=${(chars / words).toFixed(2)}`);
});
