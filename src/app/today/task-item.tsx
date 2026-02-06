"use client";

import { completeTask, discardTask } from "./actions";
import { useTransition } from "react";
import type { Task, Quadrant, TaskOrigin } from "@/generated/prisma/client";

const QUADRANT_COLORS: Record<Quadrant, string> = {
  Q1: "border-l-4 border-red-500 bg-red-50",
  Q2: "border-l-4 border-blue-500 bg-blue-50",
  Q3: "border-l-4 border-yellow-500 bg-yellow-50",
  Q4: "border-l-4 border-gray-500 bg-gray-50",
};

const QUADRANT_LABELS: Record<Quadrant, string> = {
  Q1: "긴급하고 중요",
  Q2: "중요하지만 긴급하지 않음",
  Q3: "긴급하지만 중요하지 않음",
  Q4: "긴급하지도 중요하지도 않음",
};

type TaskWithOrigin = Task & { origin?: TaskOrigin };

export default function TodayTaskItem({
  task,
  isCompleted,
}: {
  task: TaskWithOrigin;
  isCompleted: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    startTransition(async () => {
      await completeTask(task.id);
    });
  };

  const handleDiscard = () => {
    if (confirm("이 작업을 폐기하시겠습니까?")) {
      startTransition(async () => {
        await discardTask(task.id);
      });
    }
  };

  const quadrant = task.finalQuadrant ?? "Q4";

  // 완료된 작업 스타일
  if (isCompleted) {
    return (
      <div
        className={`rounded-lg p-4 transition bg-gray-100 border-l-4 border-gray-400 ${
          isPending ? "opacity-50" : "opacity-60"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-green-600 text-xl shrink-0 mt-1">✓</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-gray-600 line-through">{task.rawText}</p>
              {task.origin === "carry_over" && (
                <span className="text-xs px-2 py-0.5 rounded bg-orange-200 text-orange-800 shrink-0">
                  이월
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {quadrant}: {QUADRANT_LABELS[quadrant]}
            </p>
            {task.completedAt && (
              <p className="text-xs text-gray-500 mt-1">
                완료: {new Date(task.completedAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 진행 중인 작업 스타일
  return (
    <div
      className={`rounded-lg p-4 transition ${QUADRANT_COLORS[quadrant]} ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* 체크박스 */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={isPending}
          className="mt-1 shrink-0 w-6 h-6 rounded border-2 border-gray-400 hover:border-green-600 hover:bg-green-50 transition flex items-center justify-center group disabled:opacity-50"
          title="완료 처리"
        >
          <span className="text-green-600 opacity-0 group-hover:opacity-100 text-sm font-bold">
            ✓
          </span>
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-gray-900 font-medium text-lg">{task.rawText}</p>
            {task.origin === "carry_over" && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500 text-white shrink-0 font-semibold">
                이월
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {quadrant}: {QUADRANT_LABELS[quadrant]}
          </p>
        </div>

        <span className="text-xs font-bold px-2 py-1 rounded bg-white border shrink-0">
          {quadrant}
        </span>
      </div>

      {task.aiReason && (
        <p className="text-sm text-gray-600 mb-3 ml-9 italic">💡 {task.aiReason}</p>
      )}

      <div className="ml-9">
        <button
          type="button"
          onClick={handleDiscard}
          disabled={isPending}
          className="text-sm text-gray-500 hover:text-red-600 transition disabled:opacity-50"
        >
          ✕ 폐기
        </button>
      </div>
    </div>
  );
}
