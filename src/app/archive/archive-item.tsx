"use client";

import { useTransition } from "react";
import { restoreTask } from "./actions";
import type { Task, Quadrant } from "@/generated/prisma/client";

const QUADRANT_COLORS: Record<Quadrant, string> = {
  Q1: "bg-red-100 text-red-800 border-red-300",
  Q2: "bg-blue-100 text-blue-800 border-blue-300",
  Q3: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Q4: "bg-gray-100 text-gray-800 border-gray-300",
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
      className={`rounded-lg border border-gray-200 bg-white p-4 transition ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium truncate">{task.rawText}</p>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
            {archivedDate && <span>아카이브: {archivedDate}</span>}
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
          className="shrink-0 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "복구 중..." : "복구"}
        </button>
      </div>
    </div>
  );
}
