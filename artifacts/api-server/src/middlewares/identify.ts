import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db, visitorsTable } from "@workspace/db";

export const GUEST_COOKIE = "fin_guest";

export type IdentifiedRequest = Request & {
  userId?: string;
  isGuest?: boolean;
};

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// Throttle visitor upserts: only hit the DB once per visitor per process run.
const seenVisitors = new Set<string>();

async function trackVisitor(visitorId: string) {
  if (seenVisitors.has(visitorId)) return;
  seenVisitors.add(visitorId);
  try {
    await db
      .insert(visitorsTable)
      .values({ visitorId, kind: "guest" })
      .onConflictDoUpdate({
        target: visitorsTable.visitorId,
        set: { lastSeenAt: sql`now()`, kind: "guest" },
      });
  } catch {
    seenVisitors.delete(visitorId);
  }
}

// Every anonymous visitor gets a long-lived ID so progress and analytics keep
// working without accounts. Every route downstream can rely on req.userId.
export function identify(req: Request, res: Response, next: NextFunction): void {
  const r = req as IdentifiedRequest;
  let guestId = readCookie(req, GUEST_COOKIE);
  if (!guestId || !/^g_[A-Za-z0-9-]{8,64}$/.test(guestId)) {
    guestId = `g_${crypto.randomUUID()}`;
    res.cookie(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }
  r.userId = guestId;
  r.isGuest = true;
  void trackVisitor(guestId);
  next();
}
