/**
 * User ID 캐시 (세션당 1회만 조회)
 * - 같은 요청에서 ensureUser 중복 호출 방지
 */

const userCache = new Map<string, { userId: string; cachedAt: number }>();

export function getCachedUserId(email: string): string | null {
  const cached = userCache.get(email);
  if (!cached) return null;
  
  // 5분 이상 지나면 무효화
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (cached.cachedAt < fiveMinutesAgo) {
    userCache.delete(email);
    return null;
  }
  
  return cached.userId;
}

export function setCachedUserId(email: string, userId: string) {
  userCache.set(email, {
    userId,
    cachedAt: Date.now(),
  });
  
  // 캐시 크기 제한 (메모리 누수 방지)
  if (userCache.size > 100) {
    const firstKey = userCache.keys().next().value;
    if (firstKey) {
      userCache.delete(firstKey);
    }
  }
}
