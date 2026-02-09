import { getClassifiedTasks } from "./actions";
import TaskReviewItem from "./task-review-item";
import FinalizeButton from "./finalize-button";
import EmptyState from "@/components/EmptyState";

export default async function TodayReview() {
  const tasks = await getClassifiedTasks();
  const isManualClassify = tasks.length > 0 && tasks.every((t) => t.aiQuadrant === null);

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">
          {isManualClassify ? "작업 분류" : "분류 결과 확인"}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isManualClassify
            ? "각 작업의 중요도와 긴급도를 직접 설정하세요."
            : "AI 분류 결과를 확인하고 필요시 수정하세요."}
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="분류된 작업이 없습니다"
          description="setup에서 작업을 추가하고 AI 분류를 실행하세요."
          actionLabel="작업 추가하러 가기"
          actionHref="/today/setup"
        />
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {tasks.map((task) => (
              <TaskReviewItem key={task.id} task={task} />
            ))}
          </div>

          <FinalizeButton count={tasks.length} />
        </>
      )}
    </main>
  );
}
