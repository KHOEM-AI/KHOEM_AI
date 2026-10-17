import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import {
  KhoemError, allCoverage, canonicalizeLocale, getLanguage, getLocale,
  getTranslationDetailed, listLanguages, listLocales,
} from "../index.js";
import { availableLocales } from "../core/loader.js";
import { searchKnowledge, searchKnowledgeExact } from "../knowledge/search.js";
import { searchKhmer, searchKhmerExact } from "../khmer/search.js";
import type { ErrorCode, TranslationParams } from "../types/index.js";

type ApiErrorCode =
  | ErrorCode | "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "INVALID_JSON"
  | "PAYLOAD_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE" | "RATE_LIMITED" | "INTERNAL_ERROR";

export interface ApiLogEntry { method: string; path: string; status: number; ms: number }
export interface ApiServerOptions {
  corsOrigins?: readonly string[];
  rateLimit?: { readonly max: number; readonly windowMs: number } | false;
  maxBodyBytes?: number;
  logger?: (entry: ApiLogEntry) => void;
}

class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly headers: Record<string, string>;
  constructor(status: number, code: ApiErrorCode, message: string, headers: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

const KHOEM_STATUS: Record<ErrorCode, number> = {
  INVALID_LOCALE: 400, UNSUPPORTED_LOCALE: 404, LANGUAGE_NOT_FOUND: 404, LOCALE_NOT_FOUND: 404,
  TRANSLATION_NOT_FOUND: 404, MISSING_TRANSLATION: 404, INVALID_TRANSLATION_KEY: 400,
  INVALID_PARAMETERS: 400, REGISTRY_VALIDATION_ERROR: 500,
};
const PARAM_NAME = /^[A-Za-z_]\w{0,63}$/;
const BLOCKED_PARAMS = new Set(["__proto__", "constructor", "prototype"]);
const bad = (message: string): ApiError => new ApiError(400, "INVALID_PARAMETERS", message);
const errorBody = (code: string, message: string) => ({ success: false, error: { code, message } });

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string>): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end(payload);
}

function decodePart(s: string): string {
  try { return decodeURIComponent(s); } catch { throw bad("Invalid path encoding"); }
}

function requireString(v: unknown, name: string, max: number): string {
  if (typeof v !== "string" || v.length === 0) throw bad(`${name} is required`);
  if (v.length > max) throw bad(`${name} is too long`);
  return v;
}

function parseParams(v: unknown): TranslationParams | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== "object" || v === null || Array.isArray(v)) throw bad("params must be an object");
  const entries = Object.entries(v);
  if (entries.length > 20) throw bad("Too many params");
  const out: TranslationParams = {};
  for (const [k, val] of entries) {
    if (!PARAM_NAME.test(k) || BLOCKED_PARAMS.has(k)) throw bad("Invalid param name");
    if (typeof val === "number") {
      if (!Number.isFinite(val)) throw bad("Invalid param value");
      out[k] = val;
    } else if (typeof val === "string") {
      if (val.length > 500) throw bad("Param value too long");
      out[k] = val;
    } else throw bad("Param values must be strings or numbers");
  }
  return out;
}

function readJson(req: IncomingMessage, limit: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ct = req.headers["content-type"] ?? "";
    if (!/^application\/json\s*(;|$)/i.test(ct)) {
      reject(new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json"));
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    let done = false;
    req.on("data", (c: Buffer) => {
      if (done) return;
      size += c.length;
      if (size > limit) {
        done = true;
        chunks.length = 0;
        reject(new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body too large", { Connection: "close" }));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (done) return;
      done = true;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new ApiError(400, "INVALID_JSON", "Body is not valid JSON")); }
    });
    req.on("error", () => {
      if (done) return;
      done = true;
      reject(new ApiError(400, "INVALID_JSON", "Could not read body"));
    });
  });
}

function createLimiter(cfg: { readonly max: number; readonly windowMs: number }): (key: string, now: number) => number {
  const hits = new Map<string, { count: number; reset: number }>();
  return (key, now) => {
    if (hits.size > 50000) hits.clear();
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    const e = hits.get(key);
    if (!e || e.reset <= now) { hits.set(key, { count: 1, reset: now + cfg.windowMs }); return 0; }
    e.count++;
    return e.count > cfg.max ? Math.max(1, Math.ceil((e.reset - now) / 1000)) : 0;
  };
}

export function createApiServer(options: ApiServerOptions = {}): Server {
  const cors = new Set(options.corsOrigins ?? []);
  const limiter = options.rateLimit === false ? undefined : createLimiter(options.rateLimit ?? { max: 120, windowMs: 60_000 });
  const maxBody = options.maxBodyBytes ?? 8192;

  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const started = Date.now();
    let status = 500;
    let path = "-";
    const method = req.method ?? "GET";
    const origin = req.headers.origin;
    const corsHeaders: Record<string, string> =
      typeof origin !== "string" || cors.size === 0 ? {}
      : cors.has("*") ? { "Access-Control-Allow-Origin": "*" }
      : cors.has(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
      : {};
    const reply = (code: number, body: unknown, more: Record<string, string> = {}): void => {
      status = code;
      send(res, code, body, { ...corsHeaders, ...more });
    };
    try {
      if (limiter) {
        const wait = limiter(req.socket.remoteAddress ?? "unknown", Date.now());
        if (wait > 0) throw new ApiError(429, "RATE_LIMITED", "Too many requests", { "Retry-After": String(wait) });
      }
      const target = req.url ?? "";
      if (!target.startsWith("/") || target.startsWith("//")) throw bad("Invalid request target");
      const url = new URL(target, "http://localhost");
      path = url.pathname;
      if (method === "OPTIONS") {
        status = 204;
        res.writeHead(204, {
          ...corsHeaders,
          Allow: "GET, POST, OPTIONS",
          ...(Object.keys(corsHeaders).length > 0
            ? { "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600" }
            : {}),
        });
        res.end();
        return;
      }
      const only = (allowed: readonly string[]): void => {
        if (!allowed.includes(method)) throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed", { Allow: allowed.join(", ") });
      };
      const parts = url.pathname.replace(/\/+$/, "").slice(1).split("/");
      const [p0, p1, p2] = parts;
      if (parts.length === 1 && p0 === "health") {
        only(["GET"]);
        reply(200, { success: true, data: {
          status: "ok",
          registeredLanguages: listLanguages().length,
          registeredLocales: listLocales().length,
          languagesWithTranslationData: availableLocales().length,
        } });
      } else if (p0 === "api" && parts.length === 2 && p1 === "languages") {
        only(["GET"]);
        reply(200, { success: true, data: listLanguages() });
      } else if (p0 === "api" && parts.length === 3 && p1 === "languages" && p2 !== undefined) {
        only(["GET"]);
        const id = decodePart(p2).toLowerCase();
        if (!/^[a-z]{2,3}$/.test(id)) throw bad("Invalid language identifier");
        reply(200, { success: true, data: getLanguage(id) });
      } else if (p0 === "api" && parts.length === 2 && p1 === "locales") {
        only(["GET"]);
        reply(200, { success: true, data: listLocales() });
      } else if (p0 === "api" && parts.length === 3 && p1 === "locales" && p2 !== undefined) {
        only(["GET"]);
        const raw = decodePart(p2);
        const canon = raw.length <= 35 ? canonicalizeLocale(raw) : null;
        if (!canon) throw new KhoemError("INVALID_LOCALE", "Invalid locale identifier");
        reply(200, { success: true, data: getLocale(canon) });
      } else if (p0 === "api" && parts.length === 2 && p1 === "translate") {
        only(["GET", "POST"]);
        let locale: string;
        let key: string;
        let params: TranslationParams | undefined;
        if (method === "GET") {
          const q = url.searchParams;
          if (q.getAll("locale").length > 1 || q.getAll("key").length > 1) throw bad("Duplicate query parameter");
          locale = requireString(q.get("locale"), "locale", 35);
          key = requireString(q.get("key"), "key", 200);
        } else {
          const body = await readJson(req, maxBody);
          if (typeof body !== "object" || body === null || Array.isArray(body)) throw bad("Body must be a JSON object");
          const b = body as Record<string, unknown>;
          locale = requireString(b["locale"], "locale", 35);
          key = requireString(b["key"], "key", 200);
          params = parseParams(b["params"]);
        }
        reply(200, { success: true, data: await getTranslationDetailed(locale, key, params, { strict: true }) });
      } else if (p0 === "api" && parts.length === 2 && p1 === "coverage") {
        only(["GET"]);
        reply(200, { success: true, data: await allCoverage() });
      } else if (p0 === "api" && parts.length === 2 && p1 === "khmer") {
        only(["GET"]);
        const q = url.searchParams;
        if (q.getAll("q").length > 1 || q.getAll("exact").length > 1) throw bad("Duplicate query parameter");
        const query = requireString(q.get("q"), "q", 200);
        const answer = q.get("exact") === "1" ? searchKhmerExact(query) : searchKhmer(query);
        reply(200, { success: true, data: { query, found: answer !== null, answer } });
      } else if (p0 === "api" && parts.length === 2 && p1 === "knowledge") {
        only(["GET"]);
        const q = url.searchParams;
        if (q.getAll("q").length > 1 || q.getAll("exact").length > 1) throw bad("Duplicate query parameter");
        const query = requireString(q.get("q"), "q", 200);
        const answer = q.get("exact") === "1" ? searchKnowledgeExact(query) : searchKnowledge(query);
        reply(200, { success: true, data: { query, found: answer !== null, answer } });
      } else {
        throw new ApiError(404, "NOT_FOUND", "Route not found");
      }
    } catch (err) {
      if (res.headersSent) { res.end(); return; }
      if (err instanceof ApiError) reply(err.status, errorBody(err.code, err.message), err.headers);
      else if (err instanceof KhoemError) {
        const code = KHOEM_STATUS[err.code];
        reply(code, errorBody(err.code, code >= 500 ? "Internal server error" : err.message));
      } else reply(500, errorBody("INTERNAL_ERROR", "Internal server error"));
    } finally {
      try { options.logger?.({ method, path, status, ms: Date.now() - started }); } catch { /* logging must never break the server */ }
    }
  };

  return createServer({ requestTimeout: 10_000, headersTimeout: 5_000 }, (req, res) => { void handle(req, res); });
}
