import { prisma } from "@/lib/db";

interface RuleResult {
  alertCount: number;      // 백로그 리마인더 alertAt 설정된 수
  cleanupCount: number;    // 7일 경과 영구 삭제된 수
}

/**
 * 백로그 리마인더 + 정리 룰 엔진
 *
 * 역할:
 * 1. 백로그에 오래 머문 중요 작업(Q1/Q2) 리마인드 (alertAt)
 * 2. 소프트 딜리트된 작업 7일 후 영구 삭제
 *
 * 이전 Q1~Q4 사분면별 자동 처리 규칙은 제거됨.
 * 작업의 이월/폐기는 이월 팝업에서 사용자가 직접 결정.
 *
 * - /today 진입 시 실행 (1시간 캐시)
 * - Idempotent: 동일한 날 여러 번 실행해도 결과 동일
 */
export async function applyRules(userId: string, today: Date): Promise<RuleResult> {
  const result: RuleResult = {
    alertCount: 0,
    cleanupCount: 0,
  };

  const todayDate = today;
  const sevenDaysAgo = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. 백로그 리마인더: backlogAt으로부터 일정 기간 경과 시 alertAt 설정
  //    - Q1 (긴급+중요): 2일 경과
  //    - Q2 (중요): 4일 경과
  const backlogTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "active",
      backlogAt: { not: null },
      alertAt: null,
    },
  });

  for (const task of backlogTasks) {
    const quadrant = task.finalQuadrant ?? task.aiQuadrant;
    if (!quadrant || !task.backlogAt) continue;

    const daysSinceBacklog = Math.floor(
      (todayDate.getTime() - task.backlogAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (quadrant === "Q1" && daysSinceBacklog >= 2) {
      await prisma.task.update({
        where: { id: task.id },
        data: { alertAt: todayDate },
      });
      result.alertCount++;
    } else if (quadrant === "Q2" && daysSinceBacklog >= 4) {
      await prisma.task.update({
        where: { id: task.id },
        data: { alertAt: todayDate },
      });
      result.alertCount++;
    }
  }

  // 2. 소프트 딜리트 7일 경과 작업 영구 삭제
  //    (DailyPlanTask, Feedback은 FK cascade로 자동 삭제)
  const deleted = await prisma.task.deleteMany({
    where: {
      userId,
      status: "discarded",
      archivedAt: { lte: sevenDaysAgo },
    },
  });
  result.cleanupCount = deleted.count;

  return result;
}
