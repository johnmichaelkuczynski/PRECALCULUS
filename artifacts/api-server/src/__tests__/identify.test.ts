import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const insertValues = vi.fn();
const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock("@workspace/db", () => ({
  visitorsTable: { visitorId: "visitorId" },
  db: {
    insert: vi.fn(() => ({
      values: insertValues.mockImplementation(() => ({
        onConflictDoUpdate,
      })),
    })),
  },
}));

import { GUEST_COOKIE, identify } from "../middlewares/identify";

function runIdentify(cookie?: string) {
  const req = {
    headers: cookie ? { cookie } : {},
  } as Request;
  const res = {
    cookie: vi.fn(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;

  identify(req, res, next);
  return { req: req as Request & { userId?: string; isGuest?: boolean }, res, next };
}

describe("anonymous visitor identification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a persistent visitor id without authentication", () => {
    const { req, res, next } = runIdentify();

    expect(req.userId).toMatch(/^g_[0-9a-f-]{36}$/);
    expect(req.isGuest).toBe(true);
    expect(res.cookie).toHaveBeenCalledWith(
      GUEST_COOKIE,
      req.userId,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("reuses an existing visitor id so progress survives refreshes", () => {
    const visitorId = "g_12345678-abcd-4321-abcd-123456789abc";
    const { req, res, next } = runIdentify(`${GUEST_COOKIE}=${visitorId}`);

    expect(req.userId).toBe(visitorId);
    expect(req.isGuest).toBe(true);
    expect(res.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
});