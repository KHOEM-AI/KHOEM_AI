import fs from 'node:fs';
const rd = f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const todo = new Map(rd('code-corpus/explain/gold.todo.jsonl').map(r => [r.id, r]));
const have = new Set(rd('code-corpus/explain/gold.jsonl').map(r => r.id));
const D = {
'4caddb3ad06c': `function នេះត្រឡប់ file descriptor (fd) របស់ stream handle។
វា assert ថា handle ជាប្រភេទ UV_TCP, UV_TTY ឬ UV_NAMED_PIPE។
បើ handle->select មានតម្លៃ (មិនមែន NULL) វាត្រឡប់ fd ពី select នោះ បើមិនដូច្នោះ វាត្រឡប់ fd ពី io_watcher របស់ handle។`,
'6b0f4b7c4705': `function នេះ assert ថា expected និង actual មិនស្មើគ្នា ហើយត្រឡប់ true បើជាដូច្នេះ។
វាហៅ Helper() ជាមុនបើ t គាំទ្រ ហើយ validateEqualArgs ពិនិត្យ argument ជាមុន បើមិនត្រឹមត្រូវ វា Fail ជាមួយសារ "Invalid operation"។
បើ ObjectsAreEqual ឃើញថាតម្លៃស្មើគ្នា វា Fail ជាមួយសារ "Should not be" បើមិនដូច្នោះ ត្រឡប់ true។`,
'81e213b91414': `function នេះបំបែក string s តាមតួអក្សរ sep ដោយរំលង sep ណាដែលត្រូវបាន escape។
វាប្រើ findNextNonEscapedCharPosition រកទីតាំង sep បន្ទាប់ រួចកាត់ផ្នែកខាងមុខដាក់ក្នុង result ហើយបន្តលើផ្នែកដែលនៅសល់។
ចុងក្រោយវាបន្ថែមផ្នែកចុងក្រោយ ហើយត្រឡប់ []string។`,
};
let n = 0;
for (const [id, text] of Object.entries(D)) {
  const r = todo.get(id);
  if (!r || have.has(id)) { console.log('រំលង', id); continue; }
  fs.appendFileSync('code-corpus/explain/gold.jsonl', JSON.stringify({ id, lang: r.lang, code: r.code, explain_km: text }) + '\n');
  n++;
}
console.log('បន្ថែម', n);
