"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { getKSTToday } from "@/lib/date";
import { revalidatePath } from "next/cache";

/**
 * 아카이브된 Task 조회
 * - status=discarded + archivedAt 기준 내림차순
 */
export async function getArchivedTasks() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  return prisma.task.findMany({
    where: {
      userId,
      status: "discarded",
      archivedAt: { not: null },
    },
    orderBy: { archivedAt: "desc" },
    take: 200,
  });
}

/**
 * 아카이브된 Task 복구
 * - status → active (오늘 작업으로 즉시 복구)
 * - 오늘의 DailyPlan에 연결
 * - archivedAt / backlogAt / alertAt / needsReviewAt 초기화
 */
export async function restoreTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, status: "discarded" },
  });

  if (!task) throw new Error("Task not found or not discarded");

  // Task를 active 상태로 변경
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "active",
      archivedAt: null,
      backlogAt: null,
      alertAt: null,
      needsReviewAt: null,
    },
  });

  // 오늘의 DailyPlan 찾거나 생성
  const today = getKSTToday();

  let dailyPlan = await prisma.dailyPlan.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
  });

  if (!dailyPlan) {
    dailyPlan = await prisma.dailyPlan.create({
      data: {
        userId,
        date: today,
      },
    });
  }

  // DailyPlanTask 레코드가 없으면 생성 (이미 있으면 무시)
  const existingLink = await prisma.dailyPlanTask.findUnique({
    where: {
      dailyPlanId_taskId: {
        dailyPlanId: dailyPlan.id,
        taskId: taskId,
      },
    },
  });

  if (!existingLink) {
    await prisma.dailyPlanTask.create({
      data: {
        dailyPlanId: dailyPlan.id,
        taskId: taskId,
        origin: "backlog", // 복구된 작업은 backlog에서 온 것으로 표시
      },
    });
  }

  console.log(`[Restore] taskId: ${taskId} restored to today's active tasks`);

  revalidatePath("/archive");
  revalidatePath("/today");
}
