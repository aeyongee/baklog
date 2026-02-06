import { getBacklogTasks } from "./actions";
import BacklogItem from "./backlog-item";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default async function BacklogPage() {
  const tasks = await getBacklogTasks();

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Backlog 📦
        </h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          중요하지만 당장 급하지 않거나, 너무 오래 미뤄진 작업들이에요
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="밀린 작업이 없어요"
          description="모든 작업이 완료되었거나 오늘 계획에 포함되어 있어요."
          actionLabel="오늘의 작업 보기"
          actionHref="/today"
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {tasks.length}개 작업
            </p>
            <Link
              href="/today"
              className="text-xs font-semibold text-[#FF2F92] hover:text-[#e6287f] transition-colors"
            >
              오늘의 작업 보기
            </Link>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <BacklogItem key={task.id} task={task} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
