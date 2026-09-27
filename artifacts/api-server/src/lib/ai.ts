import {
  createOpenRouterClient,
  createVeniceClient,
} from "@workspace/integrations-openai-ai-server/openrouter";
import { AI_PROVIDERS, getAIProvider, type AIProvider } from "./aiProvider";
import { logger } from "./logger";

export const TEXT_MODEL = "gpt-5.4";
export const FAST_MODEL = "gpt-5-mini";
export const VENICE_DEFAULT_MODEL = "zai-org-glm-5-1";

const PROVIDER_MODELS: Record<AIProvider, { text: string; fast: string }> = {
  perplexity: { text: "perplexity/sonar", fast: "perplexity/sonar" },
  openai: { text: "openai/gpt-6-luna", fast: "openai/gpt-6-luna" },
  deepseek: {
    text: "deepseek/deepseek-v4.1-flash",
    fast: "deepseek/deepseek-v4.1-flash",
  },
  claude: {
    text: "anthropic/claude-fable-5.1",
    fast: "anthropic/claude-fable-5.1",
  },
  gemini: { text: "google/gemini-3.8-flash", fast: "google/gemini-3.8-flash" },
  grok: { text: "x-ai/grok-4.7", fast: "x-ai/grok-4.7" },
  // Venice is sent directly; its model is selected in modelFor below.
  venice: { text: "", fast: "" },
};

function modelFor(provider: AIProvider, requested: string): string {
  if (provider === "venice") {
    return process.env.VENICE_MODEL || VENICE_DEFAULT_MODEL;
  }
  const models = PROVIDER_MODELS[provider];
  return requested === FAST_MODEL ? models.fast : models.text;
}

const AI_ATTEMPT_TIMEOUT_MS = 25_000;

function providerIsConfigured(provider: AIProvider): boolean {
  if (provider === "venice") return Boolean(process.env.VENICE_API_KEY);
  return Boolean(
    process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL &&
      process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AIClient = ReturnType<typeof createOpenRouterClient>;

async function withModelFallback<T>(
  requestedModel: string,
  operation: (client: AIClient, model: string) => Promise<T>,
): Promise<T> {
  const preferred = getAIProvider();
  const providers = [preferred, ...AI_PROVIDERS.filter((item) => item !== preferred)]
    .filter(providerIsConfigured);

  if (providers.length === 0) {
    throw new Error(
      "No AI providers are configured. Configure the OpenRouter integration or VENICE_API_KEY.",
    );
  }

  const failures: unknown[] = [];
  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index]!;
    const model = modelFor(provider, requestedModel);
    try {
      const client =
        provider === "venice" ? createVeniceClient() : createOpenRouterClient();
      return await operation(client, model);
    } catch (error) {
      failures.push(error);
      const status =
        typeof error === "object" && error !== null
          ? ("status" in error ? error.status : undefined)
          : undefined;
      logger.warn(
        { provider, model, status },
        "AI model attempt failed; trying the next configured model",
      );

      if (index < providers.length - 1) {
        await wait(Math.min(250 * 2 ** index, 1_000));
      }
    }
  }

  throw new AggregateError(
    failures,
    `All ${providers.length} configured AI model attempts failed.`,
  );
}

export async function chatText(
  system: string,
  user: string,
  model: string = TEXT_MODEL,
): Promise<string> {
  return withModelFallback(model, async (client, selectedModel) => {
    const resp = await client.chat.completions.create(
      {
        model: selectedModel,
        max_tokens: 8192,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { timeout: AI_ATTEMPT_TIMEOUT_MS, maxRetries: 0 },
    );
    const text = resp.choices[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("The AI model returned an empty response.");
    return text;
  });
}

export async function chatJson<T = unknown>(
  system: string,
  user: string,
  model: string = TEXT_MODEL,
): Promise<T> {
  return withModelFallback(model, async (client, selectedModel) => {
    const resp = await client.chat.completions.create(
      {
        model: selectedModel,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { timeout: AI_ATTEMPT_TIMEOUT_MS, maxRetries: 0 },
    );
    const raw = resp.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("The AI model returned an empty response.");
    return JSON.parse(raw) as T;
  });
}
