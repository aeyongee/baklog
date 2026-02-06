"use server";

import { auth } from "@/lib/auth";
import { classifyTasks } from "@/lib/ai/classifyTasks";
import { prisma } from "@/lib/db";
import { parseTaskText, type ParsedTask } from "@/lib/parseTaskText";
import { ensureUser } from "@/lib/user";
import { ensureTodayPlanWithCarryOver } from "@/lib/carryOver";
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

  // 어제 미완료 Task를 오늘 계획에 자동 포함 (carry-over)
  await ensureTodayPlanWithCarryOver(userId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return prisma.task.findMany({
    where: {
      userId,
      status: { in: ["draft", "classified"] },
      createdAt: { gte: todayStart, lt: tomorrowStart },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function classifyDraftTasks(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { error: "로그인이 필요합니다." };

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

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
