"use client";

import { addTaskToTodayAndRedirect } from "./actions";
import { useTransition } from "react";
import type { Task, Quadrant } from "@/generated/prisma/client";

const QUADRANT_BADGE: Record<Quadrant, string> = {
  Q1: "bg-red-100 text-red-700",
  Q2: "bg-pink-100 text-pink-700",
  Q3: "bg-amber-100 text-amber-700",
  Q4: "bg-gray-100 text-gray-500",
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
    <div className={`rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium leading-snug">{task.rawText}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-gray-400">{createdDate}</span>
            {quadrant && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${QUADRANT_BADGE[quadrant]}`}>
                {quadrant}
              </span>
            )}
            {task.backlogAt && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                자동 이동
              </span>
            )}
          </div>

          {task.aiReason && (
            <p className="mt-1.5 text-xs text-gray-400">{task.aiReason}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToToday}
          disabled={isPending}
          className="shrink-0 rounded-xl bg-[#FF2F92] text-white font-semibold text-xs px-4 py-2.5 hover:bg-[#e6287f] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "추가 중..." : "오늘 할 일로 추가"}
        </button>
      </div>
    </div>
  );
}
