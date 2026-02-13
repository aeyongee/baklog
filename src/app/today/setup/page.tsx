import {
  getTodayTasks,
  getCarryOverPreview,
  executeCarryOver,
} from "./actions";
import SetupForm from "./setup-form";
import CarryOverPopup from "./carry-over-popup";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { redirect } from "next/navigation";

// 동적 페이지 (캐싱 없음 - 즉시 반영 필요)
export const dynamic = "force-dynamic";

export default async function TodaySetup() {
  const session = await auth();
  if (session?.user?.email) {
    const userId = await ensureUser({
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
    const pref = await prisma.userPreference.findUnique({
      where: { userId },
      select: { onboardingCompleted: true },
    });
    if (!pref?.onboardingCompleted) {
      redirect("/onboarding");
    }
  }

  // 이월 대상 미리보기 (carry-over 실행 전에 조회)
  const carryOverTasks = await getCarryOverPreview();

  const tasks = await getTodayTasks();
  const draftCount = tasks.filter(
    (t) => t.status === "draft" || t.status === "classified",
  ).length;

  return (
    <main className="mx-auto flex h-[100dvh] max-w-lg flex-col p-4">
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold dark:text-gray-100">오늘의 할 일</h1>
          {draftCount > 0 && (
            <span className="rounded-full bg-[#FF2F92] px-2 py-0.5 text-xs font-medium text-white">
              {draftCount}개 미분류
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          할 일을 입력하면 우선순위 분류는 AI가 해요.
        </p>
      </div>

      <SetupForm
        tasks={tasks.map((t) => ({
          id: t.id,
          rawText: t.rawText,
          status: t.status,
        }))}
      />

      {carryOverTasks.length > 0 && (
        <CarryOverPopup tasks={carryOverTasks} onConfirm={executeCarryOver} />
      )}
    </main>
  );
}
