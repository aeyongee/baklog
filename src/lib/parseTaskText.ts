export interface ParsedTask {
  durationMinutes?: number;
  issueKey?: string;
  url?: string;
  dateHint?: "tomorrow" | "day_after_tomorrow" | null;
}

const DURATION_RE = /(?:(\d+)h)?(?:(\d+)m)?/;
const ISSUE_KEY_RE = /[A-Z]+-\d+/;
const URL_RE = /https?:\/\/[^\s)>\]]+/;

function parseDuration(text: string): number | undefined {
  const match = text.match(DURATION_RE);
  if (!match) return undefined;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  if (hours === 0 && minutes === 0) return undefined;
  return hours * 60 + minutes;
}

function parseDateHint(text: string): ParsedTask["dateHint"] {
  if (text.includes("모레")) return "day_after_tomorrow";
  if (text.includes("내일")) return "tomorrow";
  return null;
}

export function parseTaskText(rawText: string): ParsedTask {
  try {
    const result: ParsedTask = {};

    const duration = parseDuration(rawText);
    if (duration) result.durationMinutes = duration;

    const issueMatch = rawText.match(ISSUE_KEY_RE);
    if (issueMatch) result.issueKey = issueMatch[0];

    const urlMatch = rawText.match(URL_RE);
    if (urlMatch) result.url = urlMatch[0];

    const dateHint = parseDateHint(rawText);
    if (dateHint) result.dateHint = dateHint;

    return result;
  } catch {
    return {};
  }
}
