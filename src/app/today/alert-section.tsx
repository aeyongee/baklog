"use client";

import { useTransition } from "react";
import { acknowledgeQ1Alert, moveQ1ToQ2 } from "./actions";
import type { Task, TaskOrigin } from "@/generated/prisma/client";

type TaskWithOrigin = Task & { origin?: TaskOrigin };

export default function AlertSection({ tasks }: { tasks: TaskWithOrigin[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl bg-red-50 border border-red-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">!</span>
        <h2 className="text-sm font-bold text-red-700">
          주의가 필요한 작업 ({tasks.length})
        </h2>
      </div>
      <p className="text-xs text-red-400 mb-4">
        3일 이상 미완료된 긴급 작업이에요. 계속 미완료 시 Backlog로 이동돼요.
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
    <div className={`rounded-xl bg-white p-3 shadow-sm transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""}`}>
      <p className="font-medium text-gray-900 text-sm mb-2.5">{task.rawText}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => startTransition(async () => { await acknowledgeQ1Alert(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-red-500 text-white text-xs font-semibold px-3 py-2 hover:bg-red-600 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          긴급 유지
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { await moveQ1ToQ2(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 hover:bg-gray-50 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          긴급 아님 (Q2)
        </button>
      </div>
    </div>
  );
}
