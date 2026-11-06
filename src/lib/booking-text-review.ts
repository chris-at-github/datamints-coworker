import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { askClaude, fillTemplate, readClaudeConfig } from "@/lib/claude";
import { parseTime } from "@/lib/time";
import { findEntryWithDate, saveReviewedBookingText } from "@/lib/timesheet-repository";
import { getBookingTextField, getReviewValues, type TimesheetEntry } from "@/modules/Timesheet/entries";

// Read on every review, so changed rules apply without a restart.
const TEMPLATE_PATH = path.join(process.cwd(), "prompts", "booking-text-review.md");

// One instruction block per booking size, inserted at {{durationGuidance}}.
const GUIDANCE_DIRECTORY = path.join(process.cwd(), "prompts", "booking-text-review");

// Upper limits in minutes, both inclusive; longer bookings are large.
const SMALL_MAX_MINUTES = 30;
const MEDIUM_MAX_MINUTES = 120;

// The answer is constrained to this schema by structured outputs.
const ReviewAnswer = z.object({ optimizedText: z.string() });

function getBookingSize(minutes: number): "small" | "medium" | "large" {
  if (minutes <= SMALL_MAX_MINUTES) {
    return "small";
  }

  return minutes <= MEDIUM_MAX_MINUTES ? "medium" : "large";
}

// Rewrites the booking text of an entry by the rules in the template and stores
// the answer in bookingTextReviewed; returns null if the entry does not exist.
// Runs on the server only: the API key is read from ANTHROPIC_API_KEY by the SDK.
export async function reviewBookingText(entryId: string): Promise<TimesheetEntry | null> {
  const result = await findEntryWithDate(entryId);

  if (!result) {
    return null;
  }

  const config = readClaudeConfig("BOOKING_REVIEW_MODEL", "BOOKING_REVIEW_EFFORT", "low");
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
    // The displayed text, so edits of the reviewed text are reviewed, not overwritten.
    bookingText: entry[getBookingTextField(entry)],
    bookingTextInternal: entry.bookingTextInternal,
  };
  // The block is filled first, so its placeholders are resolved before it is inserted.
  const prompt = fillTemplate(template, { ...values, durationGuidance: fillTemplate(guidance, values) });

  const { optimizedText: reviewedText } = await askClaude(prompt, ReviewAnswer, config);

  return saveReviewedBookingText(
    entry.id,
    reviewedText,
    getReviewValues({ ...entry, bookingTextReviewed: reviewedText }),
  );
}
