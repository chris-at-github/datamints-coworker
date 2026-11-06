// Server only: shared helpers for prompts sent to Claude; the API key is read
// from ANTHROPIC_API_KEY by the SDK.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

type Effort = (typeof EFFORTS)[number];

export type ClaudeConfig = { model: string; effort: Effort };

// Reads model and effort from the given variables, so every feature can use its own.
export function readClaudeConfig(modelVariable: string, effortVariable: string, defaultEffort: Effort): ClaudeConfig {
  const model = process.env[modelVariable];
  const effort = process.env[effortVariable] || defaultEffort;

  if (!model) {
    throw new Error(`${modelVariable} is not set`);
  }

  if (!EFFORTS.includes(effort as Effort)) {
    throw new Error(`${effortVariable} must be one of ${EFFORTS.join(", ")}`);
  }

  return { model, effort: effort as Effort };
}

// Replaces {{name}} with the value; unknown placeholders are removed.
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => (Object.hasOwn(values, name) ? values[name] : ""));
}

// Sends one prompt and returns the answer, constrained to the schema by
// structured outputs; a refusal or a missing answer throws.
export async function askClaude<Schema extends z.ZodType>(
  prompt: string,
  schema: Schema,
  { model, effort }: ClaudeConfig,
): Promise<z.infer<Schema>> {
  const response = await new Anthropic().messages.parse({
    model,
    max_tokens: 16000,
    output_config: { effort, format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude refused: ${response.stop_details?.explanation ?? "no explanation"}`);
  }

  if (!response.parsed_output) {
    throw new Error(`Claude returned no answer (stop reason: ${response.stop_reason})`);
  }

  return response.parsed_output;
}
