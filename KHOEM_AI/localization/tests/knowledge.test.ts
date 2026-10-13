import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { searchKnowledge, searchKnowledgeExact, knowledgeStats } from "../src/index.js";
import { createApiServer } from "../src/api/server.js";

const has = (q: string, part: string): boolean => searchKnowledge(q)?.includes(part) ?? false;

test("knowledge: AI questions route to the AI entry", () => {
  for (const q of ["Explain AI", "What is AI", "Tell me about artificial intelligence", "ពន្យល់អំពី AI"]) {
    assert.ok(has(q, "Artificial intelligence"), q);
  }
});

test("knowledge: programming and Khmer topics", () => {
  for (const q of ["Python programming", "What is Python?", "JavaScript", "សរសេរកម្មវិធី"]) {
    assert.ok(has(q, "Programming"), q);
  }
  assert.ok(has("Tell me about Angkor Wat", "សូរ្យវរ្ម័ន"));
  assert.ok(has("ទូរស័ព្ទ", "ទូរស័ព្ទ"));
  assert.ok(has("ពិធីបុណ្យអុំទូក", "អុំទូក"));
});

test("knowledge: geography topics", () => {
  assert.ok(has("ទន្លេមេគង្គ", "មេគង្គ"));
  assert.ok(has("Tonle Sap", "ទន្លេសាប"));
  assert.ok(has("ភ្នំអូរ៉ាល់", "ភ្នំ"));
  assert.ok(has("ភូមិសាស្ត្រកម្ពុជា", "ភូមិសាស្ត្រកម្ពុជា"));
});

test("knowledge: skips current healthcare questions, empty and unknown", () => {
  assert.equal(searchKnowledge("What hospital services are available today?"), null);
  assert.equal(searchKnowledge(""), null);
  assert.equal(searchKnowledge("hello world"), null);
});

test("knowledge: stats", () => {
  assert.deepEqual(knowledgeStats(), { databases: 8, totalEntries: 44 });
});

test("GET /api/knowledge contract", async () => {
  const server = createApiServer({ rateLimit: false });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const get = async (p: string) => {
    const r = await fetch(base + p);
    return { status: r.status, json: (await r.json()) as { success: boolean; data?: { found: boolean; answer: string | null } } };
  };
  try {
    const ok = await get("/api/knowledge?q=" + encodeURIComponent("Tonle Sap"));
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data?.found, true);
    assert.ok(ok.json.data?.answer?.includes("ទន្លេសាប"));

    const none = await get("/api/knowledge?q=" + encodeURIComponent("hello world"));
    assert.equal(none.status, 200);
    assert.equal(none.json.data?.found, false);
    assert.equal(none.json.data?.answer, null);

    assert.equal((await get("/api/knowledge")).status, 400);
    assert.equal((await get("/api/knowledge?q=a&q=b")).status, 400);
    assert.equal((await get("/api/knowledge?q=" + "x".repeat(201))).status, 400);
    assert.equal((await fetch(base + "/api/knowledge?q=a", { method: "POST" })).status, 405);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test("knowledge exact: real keywords only, never fuzzy or loose", () => {
  assert.ok(searchKnowledgeExact("ទន្លេមេគង្គ")?.includes("មេគង្គ"));
  assert.ok(searchKnowledgeExact("ភ្នំអូរ៉ាល់")?.includes("ភ្នំអូរ៉ាល់"));
  assert.ok(searchKnowledgeExact("Tonle Sap")?.includes("ទន្លេសាប"));
  for (const q of ["ទឹក", "ទន្លេ", "ភ្នំ", "សួស្តី", "ទូរស័ព្ទថ្មអស់លឿន", "pythn", "What is AI", "ពន្យល់អំពី AI", "សេវាពេទ្យ", "hello world", ""]) {
    assert.equal(searchKnowledgeExact(q), null, q);
  }
});

test("GET /api/knowledge?exact=1", async () => {
  const server = createApiServer({ rateLimit: false });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const get = async (p: string) => {
    const r = await fetch(base + p);
    return { status: r.status, json: (await r.json()) as { data?: { found: boolean } } };
  };
  try {
    const hit = await get("/api/knowledge?exact=1&q=" + encodeURIComponent("ទន្លេមេគង្គ"));
    assert.equal(hit.json.data?.found, true);
    const miss = await get("/api/knowledge?exact=1&q=" + encodeURIComponent("ទូរស័ព្ទថ្មអស់លឿន"));
    assert.equal(miss.status, 200);
    assert.equal(miss.json.data?.found, false);
    assert.equal((await get("/api/knowledge?q=a&exact=1&exact=1")).status, 400);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test("knowledge: Phnom Penh and bare programming", () => {
  assert.ok(has("ភ្នំពេញ", "ចតុមុខ"));
  assert.ok(has("Phnom Penh", "ចតុមុខ"));
  assert.ok(has("programming", "Programming"));
  assert.ok(searchKnowledgeExact("ភ្នំពេញ")?.includes("ចតុមុខ"));
});
