"use client";

import { addTaskToTodayAndRedirect } from "./actions";
import { useTransition } from "react";
import type { Task, Quadrant } from "@prisma/client";

const QUADRANT_BADGE: Record<Quadrant, string> = {
  Q1: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  Q2: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  Q3: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Q4: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
};

const BACKLOG_REASON: Record<Quadrant, string> = {
  Q1: "여러 번 미뤄진 중요한 작업",
  Q2: "중요하지만 당장 급하지 않음",
  Q3: "긴급하다고 했지만 계속 미뤄짐",
  Q4: "우선순위가 낮음",
};

export default function BacklogItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  const handleAddToToday = () => {
    startTransition(async () => {
      await addTaskToTodayAndRedirect(task.id);
    });
  };

  const quadrant = task.finalQuadrant ?? task.aiQuadrant;
  const createdDate = new Date(task.createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-gray-100 font-medium leading-snug">{task.rawText}</p>
          
          {quadrant && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {BACKLOG_REASON[quadrant]}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{createdDate}</span>
            {quadrant && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${QUADRANT_BADGE[quadrant]}`}>
                {quadrant}
              </span>
            )}
            {task.backlogAt && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500 dark:bg-orange-600 text-white">
                🕐 자동 이동
              </span>
            )}
          </div>

          {task.aiReason && (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{task.aiReason}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToToday}
          disabled={isPending}
          className="shrink-0 rounded-xl bg-[#FF2F92] text-white font-semibold text-xs px-4 py-2.5 hover:bg-[#e6287f] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "추가 중..." : "오늘 할 일로"}
        </button>
      </div>
    </div>
  );
}
