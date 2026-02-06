import { getArchivedTasks } from "./actions";
import ArchiveItem from "./archive-item";
import EmptyState from "@/components/EmptyState";

export default async function ArchivePage() {
  const tasks = await getArchivedTasks();

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">아카이브</h1>
        <p className="mt-2 text-gray-600">
          자동 또는 수동으로 폐기된 작업입니다. 복구하면 분류 확인 단계로 돌아갑니다.
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="아카이브된 작업이 없습니다"
          description="폐기된 작업이 여기에 표시됩니다."
          actionLabel="오늘의 작업 보기"
          actionHref="/today"
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">총 {tasks.length}개</p>
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
