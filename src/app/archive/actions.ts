"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
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
 * - status → classified (review에서 재확정 유도)
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

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "classified",
      archivedAt: null,
      backlogAt: null,
      alertAt: null,
      needsReviewAt: null,
    },
  });

  console.log(`[Restore] taskId: ${taskId} restored to classified`);

  revalidatePath("/archive");
  revalidatePath("/today/review");
}
