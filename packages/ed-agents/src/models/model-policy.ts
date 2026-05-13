/**
 * Schoolgle AI model governance for Ed agents.
 *
 * Customer/school data may only be sent to approved provider families.
 */

const APPROVED_MODEL_PREFIXES = [
  "openai/",
  "anthropic/",
  "google/",
  "meta-llama/",
  "mistralai/",
  "microsoft/",
] as const;

export function isApprovedModelId(modelId: string | undefined | null): boolean {
  if (!modelId) return false;
  const normalised = modelId.trim().toLowerCase();
  return APPROVED_MODEL_PREFIXES.some((prefix) =>
    normalised.startsWith(prefix),
  );
}

export function assertApprovedModelId(modelId: string): void {
  if (!isApprovedModelId(modelId)) {
    throw new Error(
      `AI model "${modelId}" is not approved for Schoolgle customer data. Use OpenAI, Anthropic, Google, Meta Llama, Mistral or Microsoft models only.`,
    );
  }
}
