"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";

/**
 * 특정 날짜의 완료된 Task 조회
 */
export async function getCompletedTasksByDate(dateStr: string) {
  const session = await auth();
  if (!session?.user?.email) return [];

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  // dateStr을 Date로 변환 (YYYY-MM-DD 형식)
  const targetDate = new Date(`${dateStr}T00:00:00+09:00`);
  const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

  // 해당 날짜에 완료된 Task 조회
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: "completed",
      completedAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
    orderBy: { completedAt: "desc" },
  });

  return tasks;
}

/**
 * 월별 완료 작업 개수 조회 (달력 표시용)
 */
export async function getMonthlyCompletionCount(year: number, month: number) {
  const session = await auth();
  if (!session?.user?.email) return {};

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  // 해당 월의 시작일과 종료일 계산 (KST 기준)
  const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`);
  
  // 다음 달 1일 계산 (KST 기준)
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear = year + 1;
  }
  const endDate = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`);

  // 해당 월의 완료된 작업 조회
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: "completed",
      completedAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      completedAt: true,
    },
  });

  // 날짜별로 그룹화
  const countByDate: Record<string, number> = {};
  tasks.forEach((task) => {
    if (!task.completedAt) return;
    const kstDate = new Date(task.completedAt.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kstDate.toISOString().split("T")[0];
    countByDate[dateStr] = (countByDate[dateStr] || 0) + 1;
  });

  return countByDate;
}
