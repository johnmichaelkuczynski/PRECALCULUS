import type { Request } from "express";

// identify stamps the anonymous visitor id onto every request.
export function getUserId(req: Request): string {
  const id = (req as Request & { userId?: string }).userId;
  return id ? String(id) : "";
}
