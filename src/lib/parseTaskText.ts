export interface ParsedTask {
  durationMinutes?: number;
  issueKey?: string;
  url?: string;
  dateHint?: "tomorrow" | "day_after_tomorrow" | null;
  dueDate?: Date | null;
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

function parseDueDate(text: string): Date | null {
  const now = new Date();
  const kstOffset = 9 * 60; // KST = UTC+9
  const localOffset = now.getTimezoneOffset();
  const kstNow = new Date(now.getTime() + (kstOffset + localOffset) * 60000);

  // "내일까지", "내일" 등
  if (text.match(/내일(까지)?/)) {
    const tomorrow = new Date(kstNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow;
  }

  // "모레까지", "모레" 등
  if (text.match(/모레(까지)?/)) {
    const dayAfter = new Date(kstNow);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(23, 59, 59, 999);
    return dayAfter;
  }

  // "MM/DD까지" 또는 "M/D까지" (예: "2/15까지", "12/31까지")
  const mmddMatch = text.match(/(\d{1,2})\/(\d{1,2})(까지)?/);
  if (mmddMatch) {
    const month = parseInt(mmddMatch[1], 10);
    const day = parseInt(mmddMatch[2], 10);
    const year = kstNow.getFullYear();
    const dueDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    // 과거 날짜면 내년으로
    if (dueDate < kstNow) {
      dueDate.setFullYear(year + 1);
    }
    return dueDate;
  }

  // "D일까지" (예: "3일까지", "5일까지")
  const daysMatch = text.match(/(\d+)일(까지)?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const dueDate = new Date(kstNow);
    dueDate.setDate(dueDate.getDate() + days);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate;
  }

  // "이번주" (이번 주 일요일)
  if (text.match(/이번\s?주(까지)?/)) {
    const dueDate = new Date(kstNow);
    const dayOfWeek = dueDate.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    dueDate.setDate(dueDate.getDate() + daysUntilSunday);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate;
  }

  // "다음주" (다음 주 일요일)
  if (text.match(/다음\s?주(까지)?/)) {
    const dueDate = new Date(kstNow);
    const dayOfWeek = dueDate.getDay();
    const daysUntilNextSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek + 7;
    dueDate.setDate(dueDate.getDate() + daysUntilNextSunday);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate;
  }

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

    const dueDate = parseDueDate(rawText);
    if (dueDate) result.dueDate = dueDate;

    return result;
  } catch {
    return {};
  }
}
