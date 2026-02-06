/**
 * 룰 엔진 실행 캐시
 * - 같은 날 여러 번 실행 방지
 * - 메모리 기반 간단한 캐시
 */

interface CacheEntry {
  date: string; // YYYY-MM-DD
  executedAt: number; // timestamp
}

const ruleCache = new Map<string, CacheEntry>();

/**
 * 오늘 이미 룰 엔진을 실행했는지 확인
 */
export function shouldRunRules(userId: string, today: Date): boolean {
  const dateKey = today.toISOString().split("T")[0];
  const cacheKey = `${userId}:${dateKey}`;
  
  const cached = ruleCache.get(cacheKey);
  if (!cached) return true;
  
  // 같은 날짜이고, 실행한 지 1시간 미만이면 스킵
  const hourAgo = Date.now() - 60 * 60 * 1000;
  if (cached.date === dateKey && cached.executedAt > hourAgo) {
    return false;
  }
  
  return true;
}

/**
 * 룰 엔진 실행 기록
 */
export function markRulesExecuted(userId: string, today: Date) {
  const dateKey = today.toISOString().split("T")[0];
  const cacheKey = `${userId}:${dateKey}`;
  
  ruleCache.set(cacheKey, {
    date: dateKey,
    executedAt: Date.now(),
  });
  
  // 오래된 캐시 정리 (어제 것만 남기기)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];
  
  for (const [key, value] of ruleCache.entries()) {
    if (value.date < yesterdayKey) {
      ruleCache.delete(key);
    }
  }
}
