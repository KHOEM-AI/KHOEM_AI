import { createApiServer } from "./server.js";

const port = Number(process.env["PORT"] ?? 8790);
const host = process.env["HOST"] ?? "127.0.0.1";
const origins = (process.env["KHOEM_AI_CORS_ORIGINS"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("Invalid PORT");
  process.exit(1);
}
const server = createApiServer({
  corsOrigins: origins,
  logger: (e) => console.log(`${e.method} ${e.path} ${e.status} ${e.ms}ms`),
});
server.listen(port, host, () => console.log(`KHOEM_AI API listening on http://${host}:${port}`));
for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => server.close(() => process.exit(0)));
