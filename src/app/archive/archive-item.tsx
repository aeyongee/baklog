"use client";

import { useTransition } from "react";
import { restoreTask } from "./actions";
import type { Task, Quadrant } from "@prisma/client";

const QUADRANT_COLORS: Record<Quadrant, string> = {
  Q1: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700",
  Q2: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  Q3: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
  Q4: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600",
};

const ARCHIVE_REASON: Record<Quadrant, string> = {
  Q1: "⚠️ 너무 오래 미뤄짐",
  Q2: "📦 장기 작업으로 분류",
  Q3: "🤔 긴급하다고 했지만 안 함",
  Q4: "🧹 중요하지도 긴급하지도 않음",
};

export default function ArchiveItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  const handleRestore = () => {
    startTransition(async () => {
      await restoreTask(task.id);
    });
  };

  const quadrant = task.finalQuadrant ?? task.aiQuadrant;
  const archivedDate = task.archivedAt
    ? new Date(task.archivedAt).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-gray-100 font-medium truncate">{task.rawText}</p>
          {quadrant && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {ARCHIVE_REASON[quadrant]}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {archivedDate && <span className="text-xs">아카이브: {archivedDate}</span>}
            {quadrant && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold border ${QUADRANT_COLORS[quadrant]}`}
              >
                {quadrant}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestore}
          disabled={isPending}
          className="shrink-0 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-900/20 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "복구 중..." : "복구"}
        </button>
      </div>
    </div>
  );
}
