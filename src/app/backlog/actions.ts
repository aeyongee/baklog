"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { getKSTToday } from "@/lib/date";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Backlog 조회: 오늘 DailyPlan에 포함되지 않은 미완료 Task
 */
export async function getBacklogTasks() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const today = getKSTToday();

  // 오늘 DailyPlan 조회
  const todayPlan = await prisma.dailyPlan.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
    include: {
      tasks: {
        select: { taskId: true },
      },
    },
  });

  // 오늘 계획에 포함된 Task ID 목록
  const todayTaskIds = todayPlan?.tasks.map((t) => t.taskId) ?? [];

  // Backlog 후보: 미완료 + 오늘 계획 제외
  // backlogAt이 있는 Task를 우선 표시 (룰 엔진에 의해 이동된 Task)
  const backlogTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "active",
      id: { notIn: todayTaskIds },
    },
    orderBy: [
      { backlogAt: { sort: "desc", nulls: "last" } }, // backlogAt 있는 것 우선
      { createdAt: "asc" },
    ],
    take: 100,
  });

  // backlogAt 있는 Task 개수
  const movedByRuleCount = backlogTasks.filter((t) => t.backlogAt).length;

  console.log(
    `[Backlog] userId: ${userId}, backlog tasks: ${backlogTasks.length}, moved by rule: ${movedByRuleCount}, today tasks: ${todayTaskIds.length}`
  );

  return backlogTasks;
}

/**
 * Backlog Task를 오늘 계획으로 가져오기
 */
export async function addTaskToToday(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  // 본인 소유 Task인지 확인
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) throw new Error("Task not found");

  const today = getKSTToday();

  // 오늘 DailyPlan 생성 또는 조회
  const todayPlan = await prisma.dailyPlan.upsert({
    where: {
      userId_date: { userId, date: today },
    },
    create: {
      userId,
      date: today,
    },
    update: {},
  });

  // DailyPlanTask upsert (unique 제약 기반 중복 방지)
  await prisma.dailyPlanTask.upsert({
    where: {
      dailyPlanId_taskId: {
        dailyPlanId: todayPlan.id,
        taskId: task.id,
      },
    },
    create: {
      dailyPlanId: todayPlan.id,
      taskId: task.id,
      origin: "backlog",
    },
    update: {}, // 이미 존재하면 무시
  });

  console.log(`[Backlog] taskId: ${taskId} added to today from backlog`);

  // Task 상태를 active로 변경 + backlogAt/alertAt 초기화
  // finalQuadrant이 null이면 aiQuadrant fallback (null 방지)
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "active",
      backlogAt: null,
      alertAt: null,
      needsReviewAt: null,
      ...(task.finalQuadrant == null && task.aiQuadrant
        ? {
            finalQuadrant: task.aiQuadrant,
            finalImportant: (task.aiImportance ?? 0) > 0.5,
            finalUrgent: (task.aiUrgency ?? 0) > 0.5,
          }
        : {}),
    },
  });

  revalidatePath("/backlog");
  revalidatePath("/today");
}

/**
 * Backlog Task를 오늘로 가져오고 /today로 이동
 */
export async function addTaskToTodayAndRedirect(taskId: string) {
  await addTaskToToday(taskId);
  redirect("/today");
}
