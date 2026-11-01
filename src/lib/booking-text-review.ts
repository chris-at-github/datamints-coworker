import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { parseTime } from "@/lib/time";
import { findEntryWithDate, saveReviewedBookingText } from "@/lib/timesheet-repository";
import type { TimesheetEntry } from "@/modules/Timesheet/entries";

// Read on every review, so changed rules apply without a restart.
const TEMPLATE_PATH = path.join(process.cwd(), "prompts", "booking-text-review.md");

// One instruction block per booking size, inserted at {{durationGuidance}}.
const GUIDANCE_DIRECTORY = path.join(process.cwd(), "prompts", "booking-text-review");

// Upper limits in minutes, both inclusive; longer bookings are large.
const SMALL_MAX_MINUTES = 30;
const MEDIUM_MAX_MINUTES = 120;

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

type Effort = (typeof EFFORTS)[number];

// The answer is constrained to this schema by structured outputs.
const ReviewAnswer = z.object({ optimizedText: z.string() });

// Replaces {{name}} with the value; unknown placeholders are removed.
function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => (Object.hasOwn(values, name) ? values[name] : ""));
}

function getBookingSize(minutes: number): "small" | "medium" | "large" {
  if (minutes <= SMALL_MAX_MINUTES) {
    return "small";
  }

  return minutes <= MEDIUM_MAX_MINUTES ? "medium" : "large";
}

function readConfig() {
  const model = process.env.ANTHROPIC_MODEL;
  const effort = process.env.ANTHROPIC_EFFORT ?? "low";

  if (!model) {
    throw new Error("ANTHROPIC_MODEL is not set");
  }

  if (!EFFORTS.includes(effort as Effort)) {
    throw new Error(`ANTHROPIC_EFFORT must be one of ${EFFORTS.join(", ")}`);
  }

  return { model, effort: effort as Effort };
}

// Rewrites the booking text of an entry by the rules in the template and stores
// the answer in bookingTextReviewed; returns null if the entry does not exist.
// Runs on the server only: the API key is read from ANTHROPIC_API_KEY by the SDK.
export async function reviewBookingText(entryId: string): Promise<TimesheetEntry | null> {
  const result = await findEntryWithDate(entryId);

  if (!result) {
    return null;
  }

  const { model, effort } = readConfig();
  const { entry, date } = result;
  // Whole minutes cannot be misread as a time of day; an empty duration counts as 0.
  const minutes = parseTime(entry.duration) ?? 0;
  const [template, guidance] = await Promise.all([
    readFile(TEMPLATE_PATH, "utf8"),
    readFile(path.join(GUIDANCE_DIRECTORY, `${getBookingSize(minutes)}.md`), "utf8"),
  ]);
  const values = {
    date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    duration: `${minutes} min`,
    ticketNumber: entry.ticket?.number ?? "",
    ticketTitle: entry.ticket?.title ?? "",
    bookingText: entry.bookingText,
    bookingTextInternal: entry.bookingTextInternal,
  };
  // The block is filled first, so its placeholders are resolved before it is inserted.
  const prompt = fillTemplate(template, { ...values, durationGuidance: fillTemplate(guidance, values) });

  const response = await new Anthropic().messages.parse({
    model,
    max_tokens: 16000,
    output_config: { effort, format: zodOutputFormat(ReviewAnswer) },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Review refused: ${response.stop_details?.explanation ?? "no explanation"}`);
  }

  if (!response.parsed_output) {
    throw new Error(`Review returned no answer (stop reason: ${response.stop_reason})`);
  }

  return saveReviewedBookingText(entry.id, response.parsed_output.optimizedText);
}
