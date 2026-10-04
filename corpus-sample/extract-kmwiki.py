# Extract approximate plain text from the local Khmer Wikipedia dump (CC BY-SA 4.0).
# Input : raw/kmwiki-latest-pages-articles.xml.bz2   Output: raw/kmwiki-clean.txt (local only)
import bz2, re
import xml.etree.ElementTree as ET
def clean(t):
    t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    t = re.sub(r'<ref[^>]*/>', '', t)
    t = re.sub(r'<ref[^>]*>.*?</ref>', '', t, flags=re.S)
    for _ in range(6):
        u = re.sub(r'\{\{[^{}]*\}\}', '', t)
        if u == t: break
        t = u
    t = re.sub(r'\{\|.*?\|\}', '', t, flags=re.S)
    t = re.sub(r'\[\[(?:File|Image|Category|ឯកសារ|រូបភាព|ចំណាត់ថ្នាក់ក្រុម):[^\]]*\]\]', '', t, flags=re.I)
    t = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', t)
    t = re.sub(r'\[https?://\S+ ([^\]]*)\]', r'\1', t)
    t = re.sub(r'https?://\S+', '', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r"'{2,}", '', t)
    out = []
    for l in t.split('\n'):
        l = re.sub(r'^[=*#:;]+|=+\s*$', '', l).strip()
        if l and re.search(r'[\u1780-\u17FF]', l) and '{{' not in l and '|' not in l:
            out.append(l)
    return out
pages = kept = 0
with open('raw/kmwiki-clean.txt', 'w', encoding='utf8') as w:
    for ev, el in ET.iterparse(bz2.open('raw/kmwiki-latest-pages-articles.xml.bz2'), events=('end',)):
        if el.tag.endswith('}page'):
            pages += 1
            ns = el.find('./{*}ns'); red = el.find('./{*}redirect'); tx = el.find('./{*}revision/{*}text')
            if ns is not None and ns.text == '0' and red is None and tx is not None and tx.text:
                for l in clean(tx.text):
                    w.write(l + '\n')
                kept += 1
            el.clear()
print('pages=%d main_ns_articles=%d' % (pages, kept))
