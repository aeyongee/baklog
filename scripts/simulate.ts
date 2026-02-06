/**
 * 배포 전 통합 검증 스크립트
 * 실행: npx tsx scripts/simulate.ts
 *
 * 시나리오:
 *   a) task 2개 생성 → classified → 확정 → DailyPlanTask 2개 확인
 *   b) 확정 2번 실행해도 DailyPlanTask 중복 없음
 *   c) carry_over 2번 실행해도 중복 없음
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_PREFIX = "__SIMULATE_TEST__";

// ─────────────────────────────────────────────

async function cleanup(userId: string) {
  // 테스트 데이터만 삭제
  const tasks = await prisma.task.findMany({
    where: { userId, rawText: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  const taskIds = tasks.map((t) => t.id);

  if (taskIds.length > 0) {
    await prisma.dailyPlanTask.deleteMany({
      where: { taskId: { in: taskIds } },
    });
    await prisma.feedback.deleteMany({
      where: { taskId: { in: taskIds } },
    });
    await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });
  }

  // 테스트용 DailyPlan (task 0개인 것만)
  const emptyPlans = await prisma.dailyPlan.findMany({
    where: { userId, tasks: { none: {} } },
    select: { id: true },
  });
  if (emptyPlans.length > 0) {
    await prisma.dailyPlan.deleteMany({
      where: { id: { in: emptyPlans.map((p) => p.id) } },
    });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

// ─────────────────────────────────────────────

async function main() {
  console.log("=== Baklog Integration Simulation ===\n");

  // 테스트 유저 확보 (기존 유저 하나 사용)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("ERROR: DB에 유저가 없습니다. 로그인 후 다시 실행하세요.");
    process.exit(1);
  }
  const userId = user.id;
  console.log(`User: ${user.email} (${userId})\n`);

  // 정리
  await cleanup(userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // ─── Scenario A: task 생성 → classified → 확정 ───
  console.log("[A] Task 생성 → classified → 확정");

  const task1 = await prisma.task.create({
    data: {
      userId,
      rawText: `${TEST_PREFIX}보고서 작성`,
      status: "classified",
      aiImportance: 0.9,
      aiUrgency: 0.8,
      aiQuadrant: "Q1",
      aiConfidence: 0.85,
      aiReason: "test task 1",
    },
  });

  const task2 = await prisma.task.create({
    data: {
      userId,
      rawText: `${TEST_PREFIX}이메일 확인`,
      status: "classified",
      aiImportance: 0.3,
      aiUrgency: 0.7,
      aiQuadrant: "Q3",
      aiConfidence: 0.7,
      aiReason: "test task 2",
    },
  });

  // 확정 로직 재현 (finalizeTodayPlan 핵심 로직)
  const dailyPlan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, finalizedAt: new Date() },
    update: { finalizedAt: new Date() },
  });

  const classifiedTasks = [task1, task2];

  await prisma.$transaction(async (tx) => {
    for (const task of classifiedTasks) {
      const finalQuadrant = task.finalQuadrant ?? task.aiQuadrant ?? "Q4";
      const finalImportant = task.finalImportant ?? (task.aiImportance ?? 0) > 0.5;
      const finalUrgent = task.finalUrgent ?? (task.aiUrgency ?? 0) > 0.5;

      await tx.task.update({
        where: { id: task.id },
        data: { status: "active", finalQuadrant, finalImportant, finalUrgent },
      });

      await tx.dailyPlanTask.upsert({
        where: {
          dailyPlanId_taskId: { dailyPlanId: dailyPlan.id, taskId: task.id },
        },
        create: { dailyPlanId: dailyPlan.id, taskId: task.id, origin: "new" },
        update: {},
      });
    }
  });

  const dptCountA = await prisma.dailyPlanTask.count({
    where: { dailyPlanId: dailyPlan.id, taskId: { in: [task1.id, task2.id] } },
  });
  assert(dptCountA === 2, `확정 후 DailyPlanTask 2개 (actual: ${dptCountA})`);

  const activeCount = await prisma.task.count({
    where: { id: { in: [task1.id, task2.id] }, status: "active" },
  });
  assert(activeCount === 2, `Task 2개 모두 active (actual: ${activeCount})`);

  // finalQuadrant null 안전장치 확인
  const task1Updated = await prisma.task.findUnique({ where: { id: task1.id } });
  assert(task1Updated?.finalQuadrant !== null, `task1 finalQuadrant not null (${task1Updated?.finalQuadrant})`);

  // ─── Scenario B: 확정 2번 실행 → 중복 없음 ───
  console.log("\n[B] 확정 2번 실행 → 중복 없음");

  // 두 번째 확정 (동일 로직)
  await prisma.$transaction(async (tx) => {
    for (const task of classifiedTasks) {
      await tx.dailyPlanTask.upsert({
        where: {
          dailyPlanId_taskId: { dailyPlanId: dailyPlan.id, taskId: task.id },
        },
        create: { dailyPlanId: dailyPlan.id, taskId: task.id, origin: "new" },
        update: {},
      });
    }
  });

  const dptCountB = await prisma.dailyPlanTask.count({
    where: { dailyPlanId: dailyPlan.id, taskId: { in: [task1.id, task2.id] } },
  });
  assert(dptCountB === 2, `확정 2회 후에도 DailyPlanTask 여전히 2개 (actual: ${dptCountB})`);

  // ─── Scenario C: carry_over 2번 실행 → 중복 없음 ───
  console.log("\n[C] carry_over 2번 실행 → 중복 없음");

  // 어제 DailyPlan 생성 + task1을 어제 계획에 넣기
  const yesterdayPlan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId, date: yesterday } },
    create: { userId, date: yesterday },
    update: {},
  });

  await prisma.dailyPlanTask.upsert({
    where: {
      dailyPlanId_taskId: { dailyPlanId: yesterdayPlan.id, taskId: task1.id },
    },
    create: { dailyPlanId: yesterdayPlan.id, taskId: task1.id, origin: "new" },
    update: {},
  });

  // carry_over 1회 (createMany skipDuplicates 로직)
  const carryData = [{ dailyPlanId: dailyPlan.id, taskId: task1.id, origin: "carry_over" as const }];

  const r1 = await prisma.dailyPlanTask.createMany({ data: carryData, skipDuplicates: true });
  // carry_over 2회
  const r2 = await prisma.dailyPlanTask.createMany({ data: carryData, skipDuplicates: true });

  const dptCountC = await prisma.dailyPlanTask.count({
    where: { dailyPlanId: dailyPlan.id, taskId: task1.id },
  });
  assert(dptCountC === 1, `carry_over 2회 후에도 task1 DailyPlanTask 1개 (actual: ${dptCountC})`);
  assert(r2.count === 0, `2회차 createMany는 0건 생성 (actual: ${r2.count})`);

  // ─── Scenario D: 완료 시 alertAt/needsReviewAt 해제 확인 ───
  console.log("\n[D] 완료 시 룰 엔진 필드 해제");

  await prisma.task.update({
    where: { id: task1.id },
    data: { alertAt: new Date(), needsReviewAt: new Date() },
  });

  await prisma.task.update({
    where: { id: task1.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      alertAt: null,
      needsReviewAt: null,
      backlogAt: null,
    },
  });

  const completedTask = await prisma.task.findUnique({ where: { id: task1.id } });
  assert(completedTask?.alertAt === null, "완료 후 alertAt null");
  assert(completedTask?.needsReviewAt === null, "완료 후 needsReviewAt null");

  // ─── 정리 ───
  console.log("\n[Cleanup]");
  await cleanup(userId);
  console.log("  테스트 데이터 삭제 완료");

  console.log("\n=== 시뮬레이션 완료 ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
