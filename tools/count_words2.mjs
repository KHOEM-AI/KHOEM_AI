const seg = new Intl.Segmenter('km', { granularity: 'word' });
const KH = /[\u1780-\u17FF]/g;
const maxBytes = Number(process.argv[2] || 0);   // បៃគំរូ; 0 = ទាំងអស់
const CH = 20000;                                // ទំហំដុំ (តួអក្សរ)
let words = 0, chars = 0, bytes = 0, carry = '';

function proc(text) {
  for (const s of seg.segment(text)) if (s.isWordLike) words++;
  const m = text.match(KH); if (m) chars += m.length;
}
function flush(final) {
  while (carry.length > CH || (final && carry.length)) {
    let cut = Math.min(CH, carry.length);
    if (cut < carry.length) {
      const j = carry.lastIndexOf(' ', cut);
      const k = carry.lastIndexOf('\n', cut);
      const b = Math.max(j, k);
      if (b > CH / 2) cut = b + 1;
    }
    proc(carry.slice(0, cut));
    carry = carry.slice(cut);
  }
}
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => {
  bytes += Buffer.byteLength(d);
  carry += d;
  flush(false);
  if (maxBytes && bytes >= maxBytes) { process.stdin.destroy(); }
});
process.stdin.on('end', () => {
  flush(true);
  console.log(`bytes=${bytes} words=${words} khmer_chars=${chars} chars_per_word=${(chars / words).toFixed(2)}`);
});
