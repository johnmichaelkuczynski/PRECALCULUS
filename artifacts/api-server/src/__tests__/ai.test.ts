import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOpenRouterClient: vi.fn(),
  createVeniceClient: vi.fn(),
  completionCreate: vi.fn(),
}));

vi.mock("@workspace/integrations-openai-ai-server/openrouter", () => ({
  createOpenRouterClient: mocks.createOpenRouterClient,
  createVeniceClient: mocks.createVeniceClient,
}));

vi.mock("../lib/logger", () => ({
  logger: { warn: vi.fn() },
}));

import { chatJson, chatText } from "../lib/ai";
import { aiProviderMiddleware, type AIProvider } from "../lib/aiProvider";

function response(content: string) {
  return { choices: [{ message: { content } }] };
}

function runWithProvider<T>(provider: AIProvider, operation: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const req = {
      header: (name: string) =>
        name.toLowerCase() === "x-ai-provider" ? provider : undefined,
    } as unknown as Request;
    const res = {} as Response;
    const next = (() => {
      void operation().then(resolve, reject);
    }) as NextFunction;

    aiProviderMiddleware(req, res, next);
  });
}

describe("AI model selection and fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AI_INTEGRATIONS_OPENROUTER_BASE_URL", "https://openrouter.example");
    vi.stubEnv("AI_INTEGRATIONS_OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("VENICE_API_KEY", "");

    const client = {
      chat: { completions: { create: mocks.completionCreate } },
    };
    mocks.createOpenRouterClient.mockReturnValue(client);
    mocks.createVeniceClient.mockReturnValue(client);
    mocks.completionCreate.mockResolvedValue(response("A clear answer."));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the learner's selected model first", async () => {
    const answer = await runWithProvider("deepseek", () =>
      chatText("Explain the concept.", "What is opportunity cost?"),
    );

    expect(answer).toBe("A clear answer.");
    expect(mocks.completionCreate).toHaveBeenCalledOnce();
    expect(mocks.completionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "deepseek/deepseek-v4.1-flash" }),
      expect.objectContaining({ timeout: 25_000, maxRetries: 0 }),
    );
  });

  it("tries another configured model after a provider failure", async () => {
    mocks.completionCreate
      .mockRejectedValueOnce(new Error("temporary provider error"))
      .mockResolvedValueOnce(response("Recovered answer."));

    const answer = await chatText("Explain the concept.", "What is scarcity?");

    expect(answer).toBe("Recovered answer.");
    expect(mocks.completionCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: "perplexity/sonar" }),
      expect.any(Object),
    );
    expect(mocks.completionCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: "openai/gpt-6-luna" }),
      expect.any(Object),
    );
  });

  it("falls through to another model when a JSON response is invalid", async () => {
    mocks.completionCreate
      .mockResolvedValueOnce(response("not valid JSON"))
      .mockResolvedValueOnce(response('{"correct":true}'));

    const result = await chatJson<{ correct: boolean }>(
      "Return a JSON object.",
      "Answer the question.",
    );

    expect(result).toEqual({ correct: true });
    expect(mocks.completionCreate).toHaveBeenCalledTimes(2);
  });

  it("skips Venice when its secure connection is not configured", async () => {
    const answer = await runWithProvider("venice", () =>
      chatText("Explain the concept.", "What is a market?"),
    );

    expect(answer).toBe("A clear answer.");
    expect(mocks.createVeniceClient).not.toHaveBeenCalled();
    expect(mocks.completionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "perplexity/sonar" }),
      expect.any(Object),
    );
  });
});