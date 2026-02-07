"use server";

import { auth } from "@/lib/auth";
import { classifyTasks } from "@/lib/ai/classifyTasks";
import { prisma } from "@/lib/db";
import { parseTaskText, type ParsedTask } from "@/lib/parseTaskText";
import { ensureUser } from "@/lib/user";
import { getKSTToday, getKSTTomorrow, getKSTYesterday } from "@/lib/date";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const rawText = (formData.get("rawText") as string)?.trim();
  if (!rawText) return;

  const parsed = parseTaskText(rawText);

  await prisma.task.create({
    data: {
      userId,
      rawText,
      parsed: parsed as InputJsonValue,
      status: "draft",
    },
  });

  // revalidatePath 제거 - router.refresh()가 더 빠름
}

export async function getTodayTasks() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  // carry-over는 popup 확인 시 executeCarryOver()로 실행
  // (setup 페이지에서는 자동 실행하지 않음)

  const todayStart = getKSTToday();
  const tomorrowStart = getKSTTomorrow();

  return prisma.task.findMany({
    where: {
      userId,
      status: { in: ["draft", "classified"] },
      createdAt: { gte: todayStart, lt: tomorrowStart },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteDraftTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, status: { in: ["draft", "classified"] } },
  });

  if (!task) throw new Error("Task not found");

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/today/setup");
}

export async function classifyDraftTasks(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { error: "로그인이 필요합니다." };

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const todayStart = getKSTToday();
  const tomorrowStart = getKSTTomorrow();

  const drafts = await prisma.task.findMany({
    where: {
      userId,
      status: "draft",
      createdAt: { gte: todayStart, lt: tomorrowStart },
    },
    select: { id: true, rawText: true, parsed: true },
  });

  if (drafts.length === 0) return { error: "분류할 태스크가 없습니다." };

  // 사용자 맞춤 프롬프트 조회
  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { customPrompt: true },
  });

  const input = drafts.map((t) => ({
    id: t.id,
    rawText: t.rawText,
    parsed: t.parsed as ParsedTask | null,
  }));

  let results;
  try {
    results = await classifyTasks(input, pref?.customPrompt);
  } catch (e) {
    return { error: `AI 분류 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}` };
  }

  await prisma.$transaction(
    results.map((r) =>
      prisma.task.update({
        where: { id: r.id },
        data: {
          aiImportance: r.importance,
          aiUrgency: r.urgency,
          aiQuadrant: r.quadrant,
          aiConfidence: r.confidence,
          aiReason: r.reason,
          status: "classified",
        },
      }),
    ),
  );

  redirect("/today/review");
}

/**
 * 이월 대상 작업 미리보기
 * - 어제 DailyPlan에서 status가 "active"인 미완료 작업 반환
 * - 이미 오늘 carry_over로 추가되었으면 빈 배열 반환
 * - 실제 carry-over 실행은 하지 않음 (미리보기용)
 */
export async function getCarryOverPreview() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const today = getKSTToday();
  const yesterday = getKSTYesterday();

  // 오늘 DailyPlan에 이미 carry_over 작업이 있는지 확인
  const todayPlan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: today } },
    include: {
      tasks: { where: { origin: "carry_over" } },
    },
  });

  // 이미 carry-over가 실행되었으면 빈 배열
  if (todayPlan && todayPlan.tasks.length > 0) {
    return [];
  }

  // 어제 DailyPlan에서 미완료 작업 조회
  const yesterdayPlan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: yesterday } },
    include: {
      tasks: {
        include: { task: true },
      },
    },
  });

  if (!yesterdayPlan) return [];

  return yesterdayPlan.tasks
    .map((dpt) => dpt.task)
    .filter((task) => task.status === "active");
}

/**
 * 선택적 이월 실행 (carry-over popup에서 확인 버튼 클릭 시)
 * - selectedIds에 포함된 작업만 carry_over로 오늘 DailyPlan에 추가
 * - 선택되지 않은 어제 미완료 작업은 discarded 처리
 */
export async function executeCarryOver(selectedIds: string[]) {
  const session = await auth();
  if (!session?.user?.email) return;

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const today = getKSTToday();
  const yesterday = getKSTYesterday();

  // 어제 미완료 작업 전체 조회
  const yesterdayPlan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: yesterday } },
    include: {
      tasks: {
        include: { task: true },
      },
    },
  });

  const allIncompleteTasks = yesterdayPlan?.tasks
    .map((dpt) => dpt.task)
    .filter((task) => task.status === "active") ?? [];

  // 선택되지 않은 작업 discard 처리
  const selectedSet = new Set(selectedIds);
  const discardIds = allIncompleteTasks
    .filter((t) => !selectedSet.has(t.id))
    .map((t) => t.id);

  if (discardIds.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: discardIds } },
      data: { status: "discarded" },
    });
  }

  // 선택된 작업만 오늘 DailyPlan에 carry_over로 추가
  const carryOverIds = allIncompleteTasks
    .filter((t) => selectedSet.has(t.id))
    .map((t) => t.id);

  if (carryOverIds.length > 0) {
    const todayPlan = await prisma.dailyPlan.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today },
      update: {},
    });

    await prisma.dailyPlanTask.createMany({
      data: carryOverIds.map((taskId) => ({
        dailyPlanId: todayPlan.id,
        taskId,
        origin: "carry_over" as const,
      })),
      skipDuplicates: true,
    });
  } else {
    // 선택된 작업이 없어도 오늘 DailyPlan은 생성 (이월 처리 완료 표시)
    await prisma.dailyPlan.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today },
      update: {},
    });
  }
}
