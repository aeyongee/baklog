"use client";

import { useTransition } from "react";
import { moveQ3ToQ2, archiveQ3Task } from "./actions";
import type { Task, TaskOrigin } from "@/generated/prisma/client";

type TaskWithOrigin = Task & { origin?: TaskOrigin };

export default function ReviewSection({ tasks }: { tasks: TaskWithOrigin[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">?</span>
        <h2 className="text-sm font-bold text-amber-700">
          재조정이 필요해요 ({tasks.length})
        </h2>
      </div>
      <p className="text-xs text-amber-400 mb-4">
        2일 이상 미완료된 Q3 작업이에요. 응답하지 않으면 자동 폐기돼요.
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
    <div className={`rounded-xl bg-white p-3 shadow-sm transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""}`}>
      <p className="font-medium text-gray-900 text-sm mb-2.5">{task.rawText}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => startTransition(async () => { await moveQ3ToQ2(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-[#FF2F92] text-white text-xs font-semibold px-3 py-2 hover:bg-[#e6287f] active:scale-[0.97] transition-all disabled:opacity-40"
        >
          사실 중요해요
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { await archiveQ3Task(task.id); })}
          disabled={isPending}
          className="flex-1 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs font-semibold px-3 py-2 hover:bg-gray-50 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          폐기할게요
        </button>
      </div>
    </div>
  );
}
