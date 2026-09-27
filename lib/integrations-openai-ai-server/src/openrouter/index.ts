import OpenAI from "openai";

/**
 * Creates a new OpenAI SDK client for each request. The Replit OpenRouter
 * integration supplies both values; no user-owned API key is required.
 */
export function createOpenRouterClient(): OpenAI {
  const baseURL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error(
      "OpenRouter AI integration is not configured (AI_INTEGRATIONS_OPENROUTER_BASE_URL/API_KEY missing).",
    );
  }
  return new OpenAI({ baseURL, apiKey });
}

/**
 * Venice exposes an OpenAI-compatible chat API. Its API documentation requires
 * The application supplies the documented default model, while allowing a
 * deliberate VENICE_MODEL override.
 */
export function createVeniceClient(): OpenAI {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Venice provider is unavailable: VENICE_API_KEY is not configured for direct secure API access.",
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.venice.ai/api/v1",
  });
}