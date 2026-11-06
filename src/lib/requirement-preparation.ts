import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { askClaude, fillTemplate, readClaudeConfig } from "@/lib/claude";
import { findRequirement, savePreparation } from "@/lib/requirement-repository";
import type { Requirement } from "@/modules/TicketForge/requirements";

// Read on every run, so changed rules apply without a restart.
const TEMPLATE_PATH = path.join(process.cwd(), "prompts", "ticket-forge.md");

// The answer is constrained to this schema by structured outputs.
const PreparationAnswer = z.object({
  title: z.string(),
  description: z.string(),
  internalDescription: z.string(),
  feedback: z.string(),
});

// Shown for empty fields, so Claude can tell "empty" from a missing section.
const EMPTY = "(leer)";

function orEmpty(value: string): string {
  return value.trim() || EMPTY;
}

// Prepares a requirement by the rules in the template, or refines it with an
// instruction, and stores the answer; returns null if the requirement does not
// exist. Prepare and refine are one call: the template always gets the raw text
// and the current fields, the instruction is empty for a first preparation.
export async function prepareRequirement(id: string, instruction = ""): Promise<Requirement | null> {
  const requirement = await findRequirement(id);

  if (!requirement) {
    return null;
  }

  const config = readClaudeConfig("TICKET_FORGE_MODEL", "TICKET_FORGE_EFFORT", "medium");
  const template = await readFile(TEMPLATE_PATH, "utf8");
  // The description starts as a copy of the raw text; passed on unchanged it
  // would be revised instead of being structured from scratch.
  const description = requirement.description === requirement.rawText ? "" : requirement.description;
  const prompt = fillTemplate(template, {
    rawText: requirement.rawText,
    title: orEmpty(requirement.title),
    description: orEmpty(description),
    internalDescription: orEmpty(requirement.internalDescription),
    instruction: orEmpty(instruction),
  });
  const { feedback, ...values } = await askClaude(prompt, PreparationAnswer, config);
  // A title set by the user is kept unless the instruction asked for a new one.
  const title = requirement.title.trim() && !instruction.trim() ? requirement.title : values.title.trim();

  return savePreparation(id, { ...values, title }, feedback.trim());
}
