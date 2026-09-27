import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";

export const AI_PROVIDERS = [
  "perplexity",
  "openai",
  "deepseek",
  "claude",
  "venice",
  "gemini",
  "grok",
] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number];
const providerStorage = new AsyncLocalStorage<AIProvider>();

export const aiProviderMiddleware: RequestHandler = (req, res, next) => {
  const raw = req.header("X-AI-Provider");
  const provider = raw?.trim().toLowerCase() || "perplexity";
  if (!(AI_PROVIDERS as readonly string[]).includes(provider)) {
    res.status(400).json({
      error: `Invalid X-AI-Provider. Allowed values: ${AI_PROVIDERS.join(", ")}.`,
    });
    return;
  }
  providerStorage.run(provider as AIProvider, next);
};

export function getAIProvider(): AIProvider {
  return providerStorage.getStore() ?? "perplexity";
}