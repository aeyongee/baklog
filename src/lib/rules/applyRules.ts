import { prisma } from "@/lib/db";

interface RuleResult {
  alertCount: number;      // Q1 alertAt 설정된 수
  backlogCount: number;    // Q1/Q2 backlogAt 설정된 수
  archivedCount: number;   // Q3/Q4 discarded 처리된 수
  reviewCount: number;     // Q3 needsReviewAt 설정된 수
}

/**
 * Q1~Q4 자동 룰 엔진
 * - /today 진입 시 한 번 실행
 * - Idempotent: 동일한 날 여러 번 실행해도 결과 동일
 * - 판단 기준: DailyPlan.date + DailyPlanTask 이력
 */
export async function applyRules(userId: string, today: Date): Promise<RuleResult> {
  const result: RuleResult = {
    alertCount: 0,
    backlogCount: 0,
    archivedCount: 0,
    reviewCount: 0,
  };

  // 날짜 정규화 (시간 제거)
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);

  // 최근 7일 날짜 범위
  const sevenDaysAgo = new Date(todayDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 어제 날짜
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);

  // 2일 전 날짜
  const twoDaysAgo = new Date(todayDate);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // 1. 활성 상태의 모든 Task 조회 (discarded, completed 제외)
  const activeTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "active",
    },
    include: {
      dailyPlanTasks: {
        include: {
          dailyPlan: true,
        },
      },
    },
  });

  for (const task of activeTasks) {
    const quadrant = task.finalQuadrant ?? task.aiQuadrant;
    if (!quadrant) continue;

    // DailyPlan 이력에서 날짜별 포함 횟수 계산
    const planDates = task.dailyPlanTasks
      .map((dpt) => dpt.dailyPlan.date)
      .filter((date) => date >= sevenDaysAgo && date < todayDate);

    // 고유 날짜 수 계산 (같은 날 중복 제거)
    const uniqueDates = new Set(
      planDates.map((d) => d.toISOString().split("T")[0])
    );
    const daysIncluded = uniqueDates.size;

    // 어제 포함 여부
    const wasIncludedYesterday = planDates.some(
      (d) => d.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]
    );

    // 2일 이상 포함 여부 (최근 7일 내)
    const includedTwoDaysOrMore = daysIncluded >= 2;

    switch (quadrant) {
      case "Q1":
        await handleQ1(task, daysIncluded, todayDate, result);
        break;
      case "Q2":
        await handleQ2(task, daysIncluded, todayDate, result);
        break;
      case "Q3":
        await handleQ3(task, includedTwoDaysOrMore, todayDate, result);
        break;
      case "Q4":
        await handleQ4(task, wasIncludedYesterday, todayDate, result);
        break;
    }
  }

  console.log(
    `[rules] user=${userId} alert=${result.alertCount} backlog=${result.backlogCount} archived=${result.archivedCount} review=${result.reviewCount}`
  );

  return result;
}

/**
 * Q1 (중요 + 긴급)
 * - 최근 7일 중 3번 이상 미완료 → alertAt 설정
 * - 7번 이상 → backlogAt 설정하여 Backlog로 이동
 */
async function handleQ1(
  task: { id: string; alertAt: Date | null; backlogAt: Date | null },
  daysIncluded: number,
  today: Date,
  result: RuleResult
) {
  // 이미 backlogAt 설정되어 있으면 스킵 (idempotent)
  if (task.backlogAt) return;

  if (daysIncluded >= 7) {
    // 7일 이상 미완료 → backlogAt 설정
    await prisma.task.update({
      where: { id: task.id },
      data: { backlogAt: today, alertAt: today },
    });
    result.backlogCount++;
    result.alertCount++;
  } else if (daysIncluded >= 3 && !task.alertAt) {
    // 3일 이상 미완료 → alertAt 설정
    await prisma.task.update({
      where: { id: task.id },
      data: { alertAt: today },
    });
    result.alertCount++;
  }
}

/**
 * Q2 (중요 + 긴급하지 않음)
 * - 최근 7일 중 3번 이상 미완료 → backlogAt 설정
 * - Backlog는 "나중에 할 일"의 추적 목록
 */
async function handleQ2(
  task: { id: string; backlogAt: Date | null },
  daysIncluded: number,
  today: Date,
  result: RuleResult
) {
  // 이미 backlogAt 설정되어 있으면 스킵 (idempotent)
  if (task.backlogAt) return;

  if (daysIncluded >= 3) {
    await prisma.task.update({
      where: { id: task.id },
      data: { backlogAt: today },
    });
    result.backlogCount++;
  }
}

/**
 * Q3 (중요하지 않음 + 긴급)
 * - 최근 2일 이상 미완료 → needsReviewAt 설정 (재조정 요구)
 * - 이전에 needsReviewAt이 설정되었고 사용자가 응답하지 않으면 → 자동 Archive
 */
async function handleQ3(
  task: { id: string; needsReviewAt: Date | null },
  includedTwoDaysOrMore: boolean,
  today: Date,
  result: RuleResult
) {
  if (!includedTwoDaysOrMore) return;

  if (task.needsReviewAt) {
    // 이미 재조정 요청이 있었는데 응답 안 함 → 자동 Archive
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "discarded", archivedAt: today },
    });
    result.archivedCount++;
  } else {
    // 처음 2일 이상 미완료 → needsReviewAt 설정
    await prisma.task.update({
      where: { id: task.id },
      data: { needsReviewAt: today },
    });
    result.reviewCount++;
  }
}

/**
 * Q4 (중요하지 않음 + 긴급하지 않음)
 * - 어제 DailyPlan에 포함되었고 미완료 → 다음 날 자동 Archive
 */
async function handleQ4(
  task: { id: string },
  wasIncludedYesterday: boolean,
  _today: Date,
  result: RuleResult
) {
  if (!wasIncludedYesterday) return;

  await prisma.task.update({
    where: { id: task.id },
    data: { status: "discarded", archivedAt: _today },
  });
  result.archivedCount++;
}
