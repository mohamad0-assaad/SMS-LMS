import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Stable model confirmed available on this API key.
// gemini-1.5-flash and 2.5-flash-preview variants are NOT available on this account.
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function resolveGeminiModelId(): string {
  let raw = process.env.GEMINI_MODEL?.trim();
  if (!raw) return DEFAULT_GEMINI_MODEL;
  if (raw.startsWith("models/")) raw = raw.slice("models/".length);
  // Strip "-preview" suffix — the non-preview version is available, preview is not
  if (raw.includes("2.5-flash-preview")) return "gemini-2.5-flash";
  // 1.5-flash is not on this account; upgrade to 2.0-flash
  if (raw.includes("1.5-flash")) return "gemini-2.0-flash";
  return raw;
}

/** Language model instance for @ai-sdk/google + `generateText`. */
export function getGeminiModel(apiKey: string) {
  const google = createGoogleGenerativeAI({ apiKey });
  return google(resolveGeminiModelId());
}
