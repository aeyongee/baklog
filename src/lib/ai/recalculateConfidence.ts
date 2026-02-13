import { prisma } from "@/lib/db";
import type { ClassifyResult } from "./classifyTasks";

/**
 * AI 결과의 confidence를 서버에서 재계산
 *
 * 1. 마진 기반: importance/urgency가 0.5 경계에 가까울수록 낮춤
 * 2. 교정 패턴 기반: 해당 사분면이 자주 교정된 이력이 있으면 페널티
 * 3. 최종: aiConfidence × marginFactor × (1 - correctionPenalty)
 */
export async function recalculateConfidence(
  results: ClassifyResult[],
  userId: string,
): Promise<ClassifyResult[]> {
  // 최근 90일 교정 이력에서 사분면별 교정 횟수 집계
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const feedbacks = await prisma.feedback.findMany({
    where: {
      userId,
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { aiQuadrant: true, finalQuadrant: true },
  });

  // 사분면별 교정 횟수 카운트 (AI가 해당 사분면으로 분류했는데 사용자가 바꾼 횟수)
  const correctionCounts = new Map<string, number>();
  for (const f of feedbacks) {
    if (f.aiQuadrant !== f.finalQuadrant) {
      correctionCounts.set(
        f.aiQuadrant,
        (correctionCounts.get(f.aiQuadrant) ?? 0) + 1,
      );
    }
  }

  return results.map((r) => {
    // 1. 마진 기반 팩터: 0.5 경계와의 거리 (0~0.5) → factor (0.5~1.0)
    const impMargin = Math.abs(r.importance - 0.5); // 0 ~ 0.5
    const urgMargin = Math.abs(r.urgency - 0.5); // 0 ~ 0.5
    const avgMargin = (impMargin + urgMargin) / 2; // 0 ~ 0.5
    const marginFactor = 0.5 + avgMargin; // 0.5 ~ 1.0

    // 2. 교정 패턴 기반 페널티: log 스케일, 최대 0.5
    const count = correctionCounts.get(r.quadrant) ?? 0;
    const correctionPenalty = count > 0 ? Math.min(0.5, Math.log2(count + 1) / 6) : 0;

    // 3. 최종 계산
    const recalculated = r.confidence * marginFactor * (1 - correctionPenalty);

    return {
      ...r,
      confidence: Math.round(recalculated * 1000) / 1000, // 소수점 3자리
    };
  });
}
