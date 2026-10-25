import readline from 'node:readline';

let lines = 0;
let words = 0;
let khmerChars = 0;

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

for await (const line of rl) {
  lines++;
  words += (line.match(/\S+/gu) || []).length;
  khmerChars += (line.match(/[\u1780-\u17FF]/gu) || []).length;

  if (lines % 100000 === 0) {
    console.error(`lines=${lines} words=${words} khmer_chars=${khmerChars}`);
  }
}

console.log(`lines=${lines} words=${words} khmer_chars=${khmerChars}`);
