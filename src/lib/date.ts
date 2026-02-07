const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // UTC+9

/**
 * KST(UTC+9) 기준 오늘 자정을 UTC Date로 반환
 * 예: KST 2024-01-15 00:00:00 → UTC 2024-01-14 15:00:00
 */
export function getKSTToday(): Date {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const kstDateStr = kstNow.toISOString().split("T")[0]; // YYYY-MM-DD in KST
  // KST 자정 = UTC로 변환 (9시간 빼기)
  return new Date(`${kstDateStr}T00:00:00+09:00`);
}

/**
 * KST 기준 내일 자정을 UTC Date로 반환
 */
export function getKSTTomorrow(): Date {
  const today = getKSTToday();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * KST 기준 어제 자정을 UTC Date로 반환
 */
export function getKSTYesterday(): Date {
  const today = getKSTToday();
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}

/**
 * KST 기준 날짜 문자열 (YYYY-MM-DD) 반환
 */
export function getKSTDateString(date?: Date): string {
  const target = date ?? new Date();
  const kst = new Date(target.getTime() + KST_OFFSET_MS);
  return kst.toISOString().split("T")[0];
}
