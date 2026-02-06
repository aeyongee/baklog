import { getArchivedTasks } from "./actions";
import ArchiveItem from "./archive-item";
import EmptyState from "@/components/EmptyState";

// 10분마다 재검증 (자주 변하지 않음)
export const revalidate = 600;

export default async function ArchivePage() {
  const tasks = await getArchivedTasks();

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          아카이브 🗂️
        </h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          중요하지 않다고 판단되어 자동으로 정리된 작업들이에요
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="아카이브된 작업이 없어요"
          description="모든 작업을 잘 처리하고 있어요 😁"
          actionLabel="오늘의 작업 보기"
          actionHref="/today"
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            총 {tasks.length}개
          </p>
          <div className="space-y-3">
            {tasks.map((task) => (
              <ArchiveItem key={task.id} task={task} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
