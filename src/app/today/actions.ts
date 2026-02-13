"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { getKSTToday } from "@/lib/date";
import { applyRules } from "@/lib/rules/applyRules";
import { shouldRunRules, markRulesExecuted } from "@/lib/rules/ruleCache";
import { revalidatePath } from "next/cache";

/**
 * 오늘의 DailyPlan 및 연결된 Task 조회 (active + completed)
 */
export async function getTodayTasks() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const today = getKSTToday();

  // 룰 엔진은 1시간에 1번만 실행 (성능 최적화)
  if (shouldRunRules(userId, today)) {
    await applyRules(userId, today);
    markRulesExecuted(userId, today);
  }

  // 오늘 DailyPlan 조회
  const dailyPlan = await prisma.dailyPlan.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
    include: {
      tasks: {
        include: {
          task: true,
        },
        orderBy: {
          task: { createdAt: "desc" },
        },
      },
    },
  });

  if (!dailyPlan) {
    return null;
  }

  // active와 completed Task 분리 (origin 정보 포함)
  const allTasksWithOrigin = dailyPlan.tasks.map((dpt) => ({
    ...dpt.task,
    origin: dpt.origin,
  }));

  const activeTasks = allTasksWithOrigin.filter(
    (task) => task.status === "active" && !task.backlogAt
  );
  const completedTasks = allTasksWithOrigin.filter((task) => task.status === "completed");

  return {
    dailyPlan,
    activeTasks,
    completedTasks,
  };
}

/**
 * 백로그 알림: backlogAt이 설정된 active 작업 조회
 * - 오늘 이동된 작업 (daysInBacklog = 0)
 * - 1일 이상 적체된 작업 (daysInBacklog >= 1)
 */
export async function getBacklogNotifications() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const today = getKSTToday();

  const backlogTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "active",
      backlogAt: { not: null },
    },
    orderBy: { backlogAt: "asc" },
    take: 10,
  });

  return backlogTasks.map((task) => ({
    ...task,
    daysInBacklog: Math.floor(
      (today.getTime() - (task.backlogAt?.getTime() ?? today.getTime())) /
        (24 * 60 * 60 * 1000),
    ),
  }));
}

/**
 * Task 완료 처리
 */
export async function completeTask(taskId: string) {
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

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "completed",
      completedAt: new Date(),
      alertAt: null,
      needsReviewAt: null,
      backlogAt: null,
    },
  });

  console.log(`[Complete] taskId: ${taskId} marked as completed`);

  revalidatePath("/today");
  revalidatePath("/backlog");
}

/**
 * Task 완료 취소 (active로 복원)
 */
export async function uncompleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, status: "completed" },
  });

  if (!task) throw new Error("Task not found");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "active",
      completedAt: null,
    },
  });

  revalidatePath("/today");
}

/**
 * Task 폐기 처리
 */
export async function discardTask(taskId: string) {
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
    data: {
      status: "discarded",
      archivedAt: new Date(),
    },
  });

  revalidatePath("/today");
  revalidatePath("/archive");
}

/**
 * 기본 뷰 설정 조회
 */
export async function getDefaultView(): Promise<"list" | "matrix"> {
  const session = await auth();
  if (!session?.user?.email) return "list";

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { defaultView: true },
  });

  return (pref?.defaultView === "matrix" ? "matrix" : "list");
}

/**
 * 기본 뷰 설정 업데이트
 */
export async function updateDefaultView(view: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, defaultView: view },
    update: { defaultView: view },
  });

  revalidatePath("/today");
}

/**
 * Q1 Alert 확인 — 긴급 유지(Q1)
 * - alertAt을 null로 초기화하여 Alert 섹션에서 제거
 * - finalQuadrant=Q1 유지
 */
export async function acknowledgeQ1Alert(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, finalQuadrant: "Q1" },
  });

  if (!task) throw new Error("Task not found or not Q1");

  await prisma.task.update({
    where: { id: taskId },
    data: { alertAt: null },
  });

  console.log(`[Q1 Ack] taskId: ${taskId} alert acknowledged, stays Q1`);

  revalidatePath("/today");
}

/**
 * Q1 Alert → Q2로 변경 (긴급 아님)
 * - finalQuadrant=Q2, finalUrgent=false
 * - alertAt null 처리
 */
export async function moveQ1ToQ2(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, finalQuadrant: "Q1" },
  });

  if (!task) throw new Error("Task not found or not Q1");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      finalImportant: true,
      finalUrgent: false,
      finalQuadrant: "Q2",
      alertAt: null,
    },
  });

  console.log(`[Q1→Q2] taskId: ${taskId} moved to Q2 (not urgent)`);

  revalidatePath("/today");
}

/**
 * Q3 Task를 Q2로 이동 (사실 중요함)
 * - finalImportant = true, finalUrgent = false
 * - finalQuadrant = Q2
 * - needsReviewAt 초기화
 */
export async function moveQ3ToQ2(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, finalQuadrant: "Q3" },
  });

  if (!task) throw new Error("Task not found or not Q3");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      finalImportant: true,
      finalUrgent: false,
      finalQuadrant: "Q2",
      needsReviewAt: null, // 재조정 완료
    },
  });

  console.log(`[Q3→Q2] taskId: ${taskId} moved to Q2 (important)`);

  revalidatePath("/today");
  revalidatePath("/backlog");
}

/**
 * Task를 지정된 사분면으로 이동 (드래그 앤 드롭용)
 */
export async function moveTaskToQuadrant(
  taskId: string,
  quadrant: "Q1" | "Q2" | "Q3" | "Q4",
) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, status: "active" },
  });

  if (!task) throw new Error("Task not found");

  const finalImportant = quadrant === "Q1" || quadrant === "Q2";
  const finalUrgent = quadrant === "Q1" || quadrant === "Q3";

  await prisma.task.update({
    where: { id: taskId },
    data: {
      finalImportant,
      finalUrgent,
      finalQuadrant: quadrant,
    },
  });

  revalidatePath("/today");
}

/**
 * Q3 Task 폐기 (중요하지 않음)
 */
export async function archiveQ3Task(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, finalQuadrant: "Q3" },
  });

  if (!task) throw new Error("Task not found or not Q3");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "discarded",
      needsReviewAt: null,
      archivedAt: new Date(),
    },
  });

  console.log(`[Q3→Archive] taskId: ${taskId} archived`);

  revalidatePath("/today");
  revalidatePath("/backlog");
  revalidatePath("/archive");
}
