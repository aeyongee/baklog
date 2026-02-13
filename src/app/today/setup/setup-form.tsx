"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import TaskInput from "./task-input";
import ClassifyButton from "./classify-button";
import ManualClassifyButton from "./manual-classify-button";
import DeleteTaskButton from "./delete-task-button";
import EmptyState from "@/components/EmptyState";
import { addTask } from "./actions";

type TaskItem = {
  id: string;
  rawText: string;
  status: string;
};

export default function SetupForm({
  tasks,
}: {
  tasks: TaskItem[];
}) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state: TaskItem[], newTask: TaskItem) => [...state, newTask],
  );

  const hasTasks = optimisticTasks.some((t) => t.status === "draft" || t.status === "classified");
  const limitReached = optimisticTasks.length >= 20;

  const handleTaskSubmit = (rawText: string, formData: FormData) => {
    startTransition(async () => {
      addOptimisticTask({
        id: `temp-${Date.now()}-${Math.random()}`,
        rawText,
        status: "draft",
      });
      try {
        await addTask(formData);
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        }
      }
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 액션 버튼 — sticky 상단 */}
      <div className="sticky top-0 z-10 -mx-4 bg-white/80 px-4 pb-3 pt-4 backdrop-blur dark:bg-gray-900/80">
        <div className="grid grid-cols-2 gap-3">
          <ClassifyButton
            disabled={!hasTasks}
            onPendingChange={setIsClassifying}
          />
          <ManualClassifyButton disabled={!hasTasks || isClassifying} />
        </div>
      </div>

      {limitReached && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">
            미분류 작업은 최대 20개까지만 추가할 수 있습니다.
          </p>
        </div>
      )}

      {/* 작업 리스트 — 스크롤 가능한 메인 영역 */}
      <div className="flex-1 overflow-y-auto py-3">
        {optimisticTasks.length > 0 ? (
          <ul className="space-y-2">
            {optimisticTasks.map((task, i) => {
              const isOptimistic = task.id.startsWith("temp-");
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 ${isOptimistic ? "opacity-50" : ""}`}
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm dark:text-gray-100">
                    {task.rawText}
                  </span>
                  {!isOptimistic && <DeleteTaskButton taskId={task.id} />}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="오늘 할 일을 입력하세요"
              description="아래 입력란에 작업을 하나씩 추가하면 AI가 자동으로 분류해 드립니다"
            />
          </div>
        )}
      </div>

      {/* 입력 — sticky 하단 */}
      <div className="sticky bottom-0 -mx-4 bg-white/80 px-4 pb-4 pt-3 backdrop-blur dark:bg-gray-900/80">
        <TaskInput
          disabled={isClassifying || limitReached}
          onSubmit={handleTaskSubmit}
        />
      </div>
    </div>
  );
}
