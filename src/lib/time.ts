const MINUTES_PER_DAY = 24 * 60;
const QUARTER_HOUR = 15;

// Parses "H:MM" or "HH:MM" into minutes; returns null for anything else.
export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());

  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// Formats a sum of minutes as "H:MM", e.g. "7:45" or "10:15"; unlike formatTime
// without a leading zero, because it is a duration, not a time of day.
export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

// Missing times or an end that is not after the start count as zero.
export function getDuration(startTime: string, endTime: string): string {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (start === null || end === null || end <= start) {
    return formatTime(0);
  }

  return formatTime(end - start);
}

// Returns null if a value cannot be parsed or the end would be on the next day.
export function addDuration(startTime: string, duration: string): string | null {
  const start = parseTime(startTime);
  const minutes = parseTime(duration);

  if (start === null || minutes === null || start + minutes >= MINUTES_PER_DAY) {
    return null;
  }

  return formatTime(start + minutes);
}

// Rounds to the nearest quarter hour, capped at the last quarter of the day;
// returns null if the value cannot be parsed.
export function roundTime(value: string): string | null {
  const minutes = parseTime(value);

  if (minutes === null) {
    return null;
  }

  const rounded = Math.round(minutes / QUARTER_HOUR) * QUARTER_HOUR;

  return formatTime(Math.min(rounded, MINUTES_PER_DAY - QUARTER_HOUR));
}

// Highest allowed digit per position of "HH:MM"; the second hour digit depends on the first.
function getMaxDigit(position: number, firstDigit: number): number {
  if (position === 0) {
    return 2;
  }

  if (position === 1) {
    return firstDigit === 2 ? 3 : 9;
  }

  return position === 2 ? 5 : 9;
}

// Input mask for "HH:MM": keeps up to four digits, stops at the first digit that
// would make the time impossible and adds the colon from the third digit on.
export function maskTime(value: string): string {
  const digits: number[] = [];

  for (const character of value.replace(/\D/g, "").slice(0, 4)) {
    const digit = Number(character);

    if (digit > getMaxDigit(digits.length, digits[0])) {
      break;
    }

    digits.push(digit);
  }

  const text = digits.join("");

  return text.length > 2 ? `${text.slice(0, 2)}:${text.slice(2)}` : text;
}

// Completes a masked partial input, e.g. "9" to "09:00" and "12:3" to "12:30".
export function completeTime(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits === "") {
    return value;
  }

  // A single digit can only be an hour; padding keeps "9" from becoming "90".
  const hours = digits.length === 1 ? digits.padStart(2, "0") : digits.slice(0, 2);

  return `${hours}:${digits.slice(2).padEnd(2, "0")}`;
}
