"use client";

import { useTransition } from "react";
import { moveQ3ToQ2, archiveQ3Task } from "./actions";
import type { Task, TaskOrigin } from "@prisma/client";

type TaskWithOrigin = Task & { origin?: TaskOrigin };

export default function ReviewSection({ tasks }: { tasks: TaskWithOrigin[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🤔</span>
        <h2 className="text-sm font-bold text-amber-700 dark:text-amber-400">
          다시 생각해볼까요? ({tasks.length})
        </h2>
      </div>
      <p className="text-xs text-amber-600 dark:text-amber-400/80 mb-4">
        긴급하다고 했지만 계속 안 하고 있어요. 정말 중요한가요?
      </p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <ReviewItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function ReviewItem({ task }: { task: TaskWithOrigin }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`rounded-xl bg-white dark:bg-gray-800 p-3 shadow-sm transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""}`}>
      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2.5">{task.rawText}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => startTransition(async () => { await moveQ3ToQ2(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-[#FF2F92] text-white text-xs font-semibold px-3 py-2 hover:bg-[#e6287f] active:scale-[0.97] transition-all disabled:opacity-40"
        >
          중요해요
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { await archiveQ3Task(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 text-xs font-semibold px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          안 해도 돼요
        </button>
      </div>
    </div>
  );
}
