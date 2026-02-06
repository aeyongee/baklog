import { prisma } from "@/lib/db";

/**
 * 어제 미완료 Task를 오늘 DailyPlan에 자동 포함 (Carry-Over)
 * Idempotent: 여러 번 실행해도 안전 (createMany skipDuplicates)
 */
export async function ensureTodayPlanWithCarryOver(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 1. 오늘 DailyPlan 생성 또는 조회 (idempotent)
  const todayPlan = await prisma.dailyPlan.upsert({
    where: {
      userId_date: { userId, date: today },
    },
    create: {
      userId,
      date: today,
    },
    update: {}, // 이미 존재하면 아무것도 안 함
  });

  // 2. 어제 DailyPlan 조회
  const yesterdayPlan = await prisma.dailyPlan.findUnique({
    where: {
      userId_date: { userId, date: yesterday },
    },
    include: {
      tasks: {
        include: {
          task: true,
        },
      },
    },
  });

  if (!yesterdayPlan) {
    return todayPlan;
  }

  // 3. 어제의 미완료 Task 찾기 (active 상태만, discarded 제외)
  const incompleteTasks = yesterdayPlan.tasks
    .map((dpt) => dpt.task)
    .filter((task) => task.status === "active");

  if (incompleteTasks.length === 0) {
    return todayPlan;
  }

  // 4. 오늘 DailyPlanTask에 일괄 연결 (unique 제약 기반 중복 방지)
  if (incompleteTasks.length > 0) {
    await prisma.dailyPlanTask.createMany({
      data: incompleteTasks.map((task) => ({
        dailyPlanId: todayPlan.id,
        taskId: task.id,
        origin: "carry_over" as const,
      })),
      skipDuplicates: true,
    });
  }

  return todayPlan;
}
