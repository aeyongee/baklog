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
    <>
      <div className="mt-4">
        <TaskInput
          disabled={isClassifying || limitReached}
          onSubmit={handleTaskSubmit}
        />
      </div>

      {limitReached && (
        <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-700 dark:text-red-300">
            하루에 최대 20개까지만 작업을 추가할 수 있습니다.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <ClassifyButton
          disabled={!hasTasks}
          onPendingChange={setIsClassifying}
        />
        <ManualClassifyButton disabled={!hasTasks || isClassifying} />
      </div>

      {optimisticTasks.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {optimisticTasks.map((task, i) => {
            const isOptimistic = task.id.startsWith("temp-");
            return (
              <li
                key={task.id}
                className={`flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 ${isOptimistic ? "opacity-50" : ""}`}
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
        <div className="mt-8">
          <EmptyState
            title="오늘 할 일을 입력하세요"
            description="위 입력란에 작업을 하나씩 추가하면 AI가 자동으로 분류해 드립니다"
          />
        </div>
      )}
    </>
  );
}
