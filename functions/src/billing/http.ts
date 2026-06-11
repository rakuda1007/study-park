import type { Request } from "firebase-functions/v2/https";

export function parseJsonBody(req: Request): Record<string, unknown> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (req.rawBody?.length) {
    return JSON.parse(req.rawBody.toString("utf8")) as Record<string, unknown>;
  }
  return {};
}

export function billingHttpErrorStatus(message: string): number {
  if (message.includes("認証")) return 401;
  return 400;
}
