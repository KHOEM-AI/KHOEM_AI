import type { ErrorCode } from "../types/index.js";

export class KhoemError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "KhoemError";
    this.code = code;
  }
}
