"use client";

import { useTransition } from "react";
import { acknowledgeQ1Alert, moveQ1ToQ2 } from "./actions";
import type { Task, TaskOrigin } from "@prisma/client";

type TaskWithOrigin = Task & { origin?: TaskOrigin };

export default function AlertSection({ tasks }: { tasks: TaskWithOrigin[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">⚠️</span>
        <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
          계속 미뤄지고 있어요 ({tasks.length})
        </h2>
      </div>
      <p className="text-xs text-red-600 dark:text-red-400/80 mb-4">
        중요하고 긴급한 작업인데 여러 번 미뤄졌어요. 정말 긴급한가요?
      </p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <AlertItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function AlertItem({ task }: { task: TaskWithOrigin }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`rounded-xl bg-white dark:bg-gray-800 p-3 shadow-sm transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""}`}>
      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2.5">{task.rawText}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => startTransition(async () => { await acknowledgeQ1Alert(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-red-500 text-white text-xs font-semibold px-3 py-2 hover:bg-red-600 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          여전히 긴급해요
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { await moveQ1ToQ2(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}
