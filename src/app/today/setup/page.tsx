import { getTodayTasks } from "./actions";
import SetupForm from "./setup-form";
import EmptyState from "@/components/EmptyState";
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

  const tasks = await getTodayTasks();
  const hasDrafts = tasks.some((t) => t.status === "draft");

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="text-xl font-bold dark:text-gray-100">오늘의 할 일 ✅</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        할 일을 입력하면 우선순위 분류는 AI가 해요 😁
      </p>

      <SetupForm hasDrafts={hasDrafts} />

      {tasks.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {tasks.map((task, i) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
            >
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {i + 1}
              </span>
              <span className="text-sm">{task.rawText}</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {task.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="오늘 할 일을 입력하세요"
            description="위 입력란에 작업을 하나씩 추가하면 AI가 자동으로 분류해 드립니다"
          />
        </div>
      )}
    </main>
  );
}
