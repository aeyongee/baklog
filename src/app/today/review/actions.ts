"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { getKSTToday } from "@/lib/date";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Review 단계에서 classified 상태의 Task 조회
 * - DailyPlan 생성 이전이므로 Task 테이블 직접 조회
 * - userId와 status='classified'만 사용
 */
export async function getClassifiedTasks() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: "classified",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  console.log(`[Review] userId: ${userId}, classified tasks count: ${tasks.length}`);

  return tasks;
}

/**
 * Review 단계에서 사용자가 Important/Urgent 값을 수정
 */
export async function updateTaskClassification(
  taskId: string,
  important: boolean,
  urgent: boolean,
) {
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

  // 최종 사용자 판단 저장
  let finalQuadrant: "Q1" | "Q2" | "Q3" | "Q4";
  if (important && urgent) finalQuadrant = "Q1";
  else if (important && !urgent) finalQuadrant = "Q2";
  else if (!important && urgent) finalQuadrant = "Q3";
  else finalQuadrant = "Q4";

  await prisma.task.update({
    where: { id: taskId },
    data: {
      finalImportant: important,
      finalUrgent: urgent,
      finalQuadrant,
    },
  });

  revalidatePath("/today/review");
}

/**
 * Review 단계에서 사용자가 카테고리(업무/개인) 수정
 */
export async function updateTaskCategory(
  taskId: string,
  category: string | null,
) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) throw new Error("Task not found");

  await prisma.task.update({
    where: { id: taskId },
    data: { category },
  });

  revalidatePath("/today/review");
}

/**
 * Review 단계에서 사용자가 마감일 수정
 */
export async function updateTaskDueDate(
  taskId: string,
  dueDate: Date | null,
) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) throw new Error("Task not found");

  await prisma.task.update({
    where: { id: taskId },
    data: { dueDate },
  });

  revalidatePath("/today/review");
}

/**
 * Review 확정 → DailyPlan 생성 및 Task 상태 변경
 * Idempotent: 중복 클릭해도 안전하게 처리
 */
export async function finalizeTodayPlan() {
  const session = await auth();
  if (!session?.user?.email) return { error: "로그인이 필요합니다." };

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const todayStart = getKSTToday();

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: "classified",
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`[Finalize] userId: ${userId}, classified tasks count: ${tasks.length}`);

  if (tasks.length === 0) {
    return { error: "확정할 태스크가 없습니다." };
  }

  // DailyPlan 생성 또는 조회 (idempotent)
  const dailyPlan = await prisma.dailyPlan.upsert({
    where: {
      userId_date: { userId, date: todayStart },
    },
    create: {
      userId,
      date: todayStart,
      finalizedAt: new Date(),
    },
    update: {
      finalizedAt: new Date(),
    },
  });

  console.log(`[Finalize] DailyPlan id: ${dailyPlan.id}`);

  // Task 상태 변경, DailyPlanTask 생성, Feedback 생성
  await prisma.$transaction(async (tx) => {
    for (const task of tasks) {
      // 1. finalQuadrant가 없으면 aiQuadrant로 채우기 (null 방지)
      const finalQuadrant = task.finalQuadrant ?? task.aiQuadrant ?? "Q4";
      const finalImportant = task.finalImportant ?? (task.aiImportance ?? 0) > 0.5;
      const finalUrgent = task.finalUrgent ?? (task.aiUrgency ?? 0) > 0.5;

      // 2. Task 상태를 active로 변경 + finalQuadrant 보장
      await tx.task.update({
        where: { id: task.id },
        data: {
          status: "active",
          finalQuadrant,
          finalImportant,
          finalUrgent,
        },
      });

      // 3. DailyPlanTask upsert (unique 제약 기반 중복 방지)
      await tx.dailyPlanTask.upsert({
        where: {
          dailyPlanId_taskId: {
            dailyPlanId: dailyPlan.id,
            taskId: task.id,
          },
        },
        create: {
          dailyPlanId: dailyPlan.id,
          taskId: task.id,
          origin: "new",
        },
        update: {}, // 이미 존재하면 무시
      });

      // 4. Feedback: 이미 동일 taskId + userId 조합이 있으면 skip
      if (task.aiQuadrant) {
        const existingFeedback = await tx.feedback.findFirst({
          where: { userId, taskId: task.id },
        });
        if (!existingFeedback) {
          await tx.feedback.create({
            data: {
              userId,
              taskId: task.id,
              aiQuadrant: task.aiQuadrant,
              finalQuadrant,
            },
          });
        }
      }
    }
  });

  console.log(`[Finalize] Finalized ${tasks.length} tasks`);

  revalidatePath("/today");
  redirect("/today");
}
