/**
 * Schoolgle AI model governance.
 *
 * Non-negotiable product rule:
 * customer/school data may only be sent to approved provider families with
 * suitable privacy, contractual and transfer documentation in place.
 */

const APPROVED_OPENROUTER_PREFIXES = [
  "openai/",
  "anthropic/",
  "google/",
  "meta-llama/",
  "mistralai/",
  "microsoft/",
] as const;

const APPROVED_DIRECT_OPENAI_PREFIXES = [
  "gpt-",
  "o1",
  "o3",
  "o4",
  "text-embedding-",
] as const;

const APPROVED_DIRECT_GOOGLE_PREFIXES = [
  "gemini-",
  "models/gemini-",
] as const;

const MODEL_COST_RANK: Record<string, number> = {
  "openai/gpt-4o-mini": 1,
  "google/gemini-2.0-flash-lite-001": 2,
  "google/gemini-2.0-flash-001": 3,
  "google/gemini-2.5-flash": 4,
  "google/gemini-2.5-flash-preview": 5,
  "gemini-2.5-flash": 5,
  "meta-llama/llama-3.3-70b-instruct": 6,
  "openai/gpt-4o": 7,
  "mistralai/mistral-ocr-latest": 8,
  "google/gemini-2.5-pro": 9,
  "anthropic/claude-3.5-sonnet": 10,
  "anthropic/claude-sonnet-4": 11,
};

export const APPROVED_AI_PROVIDER_FAMILIES = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Meta Llama",
  "Mistral",
  "Microsoft",
] as const;

export function isApprovedModelId(modelId: string | undefined | null): boolean {
  if (!modelId) return false;
  const normalised = modelId.trim().toLowerCase();

  return (
    APPROVED_OPENROUTER_PREFIXES.some((prefix) =>
      normalised.startsWith(prefix),
    ) ||
    APPROVED_DIRECT_OPENAI_PREFIXES.some((prefix) =>
      normalised.startsWith(prefix),
    ) ||
    APPROVED_DIRECT_GOOGLE_PREFIXES.some((prefix) =>
      normalised.startsWith(prefix),
    )
  );
}

export function assertApprovedModelId(modelId: string): void {
  if (!isApprovedModelId(modelId)) {
    throw new Error(
      `AI model "${modelId}" is not approved for Schoolgle customer data. Use OpenAI, Anthropic, Google, Meta Llama, Mistral or Microsoft models only.`,
    );
  }
}

export function chooseLowestCostApprovedModel(modelIds: string[]): string {
  const approvedModels = modelIds.filter(isApprovedModelId);
  if (approvedModels.length === 0) {
    throw new Error("No approved AI models were provided.");
  }

  return approvedModels.sort(
    (left, right) =>
      (MODEL_COST_RANK[left] ?? Number.MAX_SAFE_INTEGER) -
      (MODEL_COST_RANK[right] ?? Number.MAX_SAFE_INTEGER),
  )[0];
}
