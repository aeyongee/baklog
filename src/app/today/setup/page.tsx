import { getTodayTasks } from "./actions";
import ClassifyButton from "./classify-button";
import TaskInput from "./task-input";
import EmptyState from "@/components/EmptyState";

export default async function TodaySetup() {
  const tasks = await getTodayTasks();
  const hasDrafts = tasks.some((t) => t.status === "draft");

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="text-xl font-bold">오늘의 태스크</h1>
      <p className="mt-1 text-sm text-gray-500">
        할 일을 입력하고 AI에게 분류를 맡기세요.
      </p>

      <div className="mt-4">
        <TaskInput />
      </div>

      {tasks.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {tasks.map((task, i) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2"
            >
              <span className="text-xs text-gray-400">{i + 1}</span>
              <span className="text-sm">{task.rawText}</span>
              <span className="ml-auto text-xs text-gray-400">
                {task.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="오늘 할 일을 입력하세요"
            description="위 입력란에 태스크를 하나씩 추가하면 AI가 자동으로 분류해 드립니다."
          />
        </div>
      )}

      <div className="mt-6">
        <ClassifyButton disabled={!hasDrafts} />
      </div>
    </main>
  );
}
