import { test, after } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import type { IncomingHttpHeaders, Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApiServer } from "../src/api/server.js";
import type { ApiServerOptions } from "../src/api/server.js";
import { listLanguages, listLocales } from "../src/index.js";

interface Body { success: boolean; data?: unknown; error?: { code: string; message: string } }
interface Res { status: number; headers: IncomingHttpHeaders; json: Body; text: string }
interface Tr { text: string; usedLocale: string | null; resolvedLocale: string | null; fallbackUsed: boolean }

const start = (opts: ApiServerOptions = { rateLimit: false }): Promise<Server> =>
  new Promise((resolve) => { const s = createApiServer(opts); s.listen(0, "127.0.0.1", () => resolve(s)); });
const stop = (s: Server): Promise<void> =>
  new Promise((resolve) => { s.close(() => resolve()); s.closeAllConnections(); });
const data = <T>(r: Res): T => r.json.data as T;

function call(s: Server, method: string, path: string, body?: string, headers: Record<string, string> = {}): Promise<Res> {
  const { port } = s.address() as AddressInfo;
  return new Promise((resolve, reject) => {
    const req = request({
      host: "127.0.0.1", port, method, path, agent: false,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json", "Content-Length": String(Buffer.byteLength(body)) } : {}),
        ...headers,
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({ status: res.statusCode ?? 0, headers: res.headers, text, json: text ? (JSON.parse(text) as Body) : { success: true } });
      });
    });
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

const api = await start();
after(() => stop(api));
const post = (b: unknown) => call(api, "POST", "/api/translate", JSON.stringify(b));

test("health + security headers", async () => {
  const r = await call(api, "GET", "/health");
  assert.equal(r.status, 200);
  assert.equal(r.json.success, true);
  assert.equal(data<{ status: string }>(r).status, "ok");
  assert.equal(r.headers["x-content-type-options"], "nosniff");
  assert.equal(r.headers["cache-control"], "no-store");
  assert.match(String(r.headers["content-type"]), /charset=utf-8/);
});

test("languages: list, one, unknown, malformed", async () => {
  const all = await call(api, "GET", "/api/languages");
  assert.equal(data<unknown[]>(all).length, listLanguages().length);
  assert.ok(data<{ languageId: string; nativeName: string }[]>(all).some((l) => l.languageId === "km" && l.nativeName === listLanguages().find((x) => x.languageId === "km")?.nativeName));
  const km = await call(api, "GET", "/api/languages/km");
  assert.equal(km.status, 200);
  assert.equal(data<{ iso639_3: string }>(km).iso639_3, "khm");
  const zz = await call(api, "GET", "/api/languages/zz");
  assert.equal(zz.status, 404);
  assert.equal(zz.json.error?.code, "LANGUAGE_NOT_FOUND");
  const enc = await call(api, "GET", "/api/languages/%E0%A4%A");
  assert.equal(enc.status, 400);
});

test("locales: list, canonicalized lookup, unknown, invalid", async () => {
  const all = await call(api, "GET", "/api/locales");
  assert.equal(data<unknown[]>(all).length, listLocales().length);
  const hk = await call(api, "GET", "/api/locales/zh-hk");
  assert.equal(hk.status, 200);
  assert.equal(data<{ locale: string }>(hk).locale, "zh-HK");
  const xx = await call(api, "GET", "/api/locales/xx-ZZ");
  assert.equal(xx.status, 404);
  assert.equal(xx.json.error?.code, "LOCALE_NOT_FOUND");
  const inv = await call(api, "GET", "/api/locales/%2F%2F%2F");
  assert.equal(inv.status, 400);
  assert.equal(inv.json.error?.code, "INVALID_LOCALE");
});

test("path traversal is rejected without leaking paths", async () => {
  const a = await call(api, "GET", "/api/languages/..%2F..%2Fetc%2Fpasswd");
  assert.equal(a.status, 400);
  const b = await call(api, "GET", "/api/locales/..%2F..%2Fetc");
  assert.equal(b.status, 400);
  const c = await call(api, "GET", "/api/translate?locale=en&key=..%2Fetc");
  assert.equal(c.status, 400);
  assert.equal(c.json.error?.code, "INVALID_TRANSLATION_KEY");
  assert.doesNotMatch(a.text + b.text + c.text, /\/data\/|node_modules|dist\//);
});

test("GET translate: Khmer, region, fallback, unregistered", async () => {
  const km = await call(api, "GET", "/api/translate?locale=km&key=common.save");
  assert.equal(km.status, 200);
  assert.equal(data<Tr>(km).text, "រក្សាទុក");
  const kh = await call(api, "GET", "/api/translate?locale=km-KH&key=navigation.home");
  assert.equal(data<Tr>(kh).text, "ទំព័រដើម");
  const th = await call(api, "GET", "/api/translate?locale=th&key=common.save");
  assert.equal(data<Tr>(th).text, "Save");
  assert.equal(data<Tr>(th).fallbackUsed, true);
  const fr = await call(api, "GET", "/api/translate?locale=fr&key=common.save");
  assert.equal(fr.status, 200);
  assert.equal(data<Tr>(fr).text, "Save");
  assert.equal(data<Tr>(fr).resolvedLocale, null);
});

test("GET translate: errors are structured", async () => {
  const missing = await call(api, "GET", "/api/translate?locale=en&key=common.nope");
  assert.equal(missing.status, 404);
  assert.equal(missing.json.success, false);
  assert.equal(missing.json.error?.code, "TRANSLATION_NOT_FOUND");
  const key = await call(api, "GET", "/api/translate?locale=en&key=common..save");
  assert.equal(key.status, 400);
  assert.equal(key.json.error?.code, "INVALID_TRANSLATION_KEY");
  const loc = await call(api, "GET", "/api/translate?locale=%2F%2F%2F&key=common.save");
  assert.equal(loc.status, 400);
  assert.equal(loc.json.error?.code, "INVALID_LOCALE");
  const none = await call(api, "GET", "/api/translate?key=common.save");
  assert.equal(none.status, 400);
  assert.equal(none.json.error?.code, "INVALID_PARAMETERS");
  const dup = await call(api, "GET", "/api/translate?locale=en&locale=km&key=common.save");
  assert.equal(dup.status, 400);
});

test("POST translate: interpolation and plurals", async () => {
  const hello = await post({ locale: "km", key: "welcome.user", params: { name: "KHOEM" } });
  assert.equal(hello.status, 200);
  assert.equal(data<Tr>(hello).text, "សួស្តី KHOEM");
  assert.equal(data<Tr>(await post({ locale: "en", key: "common.items", params: { count: 1 } })).text, "1 item");
  assert.equal(data<Tr>(await post({ locale: "en", key: "common.items", params: { count: 5 } })).text, "5 items");
  const noCount = await post({ locale: "en", key: "common.items" });
  assert.equal(noCount.status, 400);
  assert.equal(noCount.json.error?.code, "INVALID_PARAMETERS");
});

test("POST translate: rejects bad bodies and params", async () => {
  const bad = await call(api, "POST", "/api/translate", "{not json");
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error?.code, "INVALID_JSON");
  const ct = await call(api, "POST", "/api/translate", '{"a":1}', { "Content-Type": "text/plain" });
  assert.equal(ct.status, 415);
  const big = await post({ locale: "en", key: "common.save", params: { a: "x".repeat(9000) } });
  assert.equal(big.status, 413);
  const long = await post({ locale: "en", key: "common.save", params: { a: "x".repeat(600) } });
  assert.equal(long.status, 400);
  assert.equal((await post([1, 2])).status, 400);
  assert.equal((await post({ locale: "en", key: "common.save", params: [1] })).status, 400);
  assert.equal((await post({ locale: "en", key: "common.save", params: { a: { b: 1 } } })).status, 400);
  const proto = await call(api, "POST", "/api/translate", '{"locale":"en","key":"common.save","params":{"__proto__":"x"}}');
  assert.equal(proto.status, 400);
});

test("routing: unknown route, wrong method, bad target", async () => {
  const nf = await call(api, "GET", "/nope");
  assert.equal(nf.status, 404);
  assert.equal(nf.json.error?.code, "NOT_FOUND");
  const del = await call(api, "DELETE", "/health");
  assert.equal(del.status, 405);
  assert.equal(del.headers["allow"], "GET");
  assert.equal((await call(api, "POST", "/api/languages", "{}")).status, 405);
  assert.equal((await call(api, "GET", "//x")).status, 400);
});

test("coverage endpoint reports real coverage", async () => {
  const r = await call(api, "GET", "/api/coverage");
  assert.equal(r.status, 200);
  const rows = data<{ locale: string; coverage: number }[]>(r);
  assert.equal(rows.find((x) => x.locale === "en")?.coverage, 100);
  assert.equal(rows.find((x) => x.locale === "km")?.coverage, 100);
});

test("CORS: off by default, allow-list when configured", async () => {
  const off = await call(api, "GET", "/health", undefined, { Origin: "https://app.example" });
  assert.equal(off.headers["access-control-allow-origin"], undefined);
  const s = await start({ rateLimit: false, corsOrigins: ["https://app.example"] });
  try {
    const ok = await call(s, "GET", "/health", undefined, { Origin: "https://app.example" });
    assert.equal(ok.headers["access-control-allow-origin"], "https://app.example");
    const no = await call(s, "GET", "/health", undefined, { Origin: "https://evil.example" });
    assert.equal(no.headers["access-control-allow-origin"], undefined);
    const pre = await call(s, "OPTIONS", "/api/translate", undefined, { Origin: "https://app.example" });
    assert.equal(pre.status, 204);
    assert.match(String(pre.headers["access-control-allow-methods"]), /GET/);
  } finally { await stop(s); }
});

test("rate limit returns 429 with Retry-After", async () => {
  const s = await start({ rateLimit: { max: 2, windowMs: 60_000 } });
  try {
    assert.equal((await call(s, "GET", "/health")).status, 200);
    assert.equal((await call(s, "GET", "/health")).status, 200);
    const r = await call(s, "GET", "/health");
    assert.equal(r.status, 429);
    assert.equal(r.json.error?.code, "RATE_LIMITED");
    assert.ok(r.headers["retry-after"]);
  } finally { await stop(s); }
});
