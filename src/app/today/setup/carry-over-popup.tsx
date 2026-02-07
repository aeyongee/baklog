"use client";

import { useState, useTransition } from "react";
import type { Task } from "@prisma/client";

const QUADRANT_META: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  Q1: { label: "긴급+중요", badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dotClass: "bg-red-500" },
  Q2: { label: "중요", badgeClass: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400", dotClass: "bg-pink-500" },
  Q3: { label: "긴급", badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dotClass: "bg-amber-500" },
  Q4: { label: "나중에", badgeClass: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400", dotClass: "bg-gray-400" },
};

interface CarryOverPopupProps {
  tasks: Task[];
  onConfirm: (selectedIds: string[]) => Promise<void>;
}

export default function CarryOverPopup({ tasks, onConfirm }: CarryOverPopupProps) {
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(tasks.map((t) => t.id))
  );

  if (!open) return null;

  function toggleTask(taskId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm(Array.from(selectedIds));
      setOpen(false);
    });
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-xl animate-slide-up">
        <h2 className="text-lg font-bold dark:text-gray-100">
          어제 미완료 작업이 있어요
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          이월할 작업을 선택하세요. 선택하지 않은 작업은 버려집니다.
        </p>

        <ul className="mt-4 max-h-60 overflow-y-auto space-y-2">
          {tasks.map((task) => {
            const quadrant = task.finalQuadrant ?? task.aiQuadrant ?? "Q4";
            const meta = QUADRANT_META[quadrant] ?? QUADRANT_META.Q4;
            const checked = selectedIds.has(task.id);

            return (
              <li
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  checked
                    ? "border-[#FF2F92]/40 bg-pink-50/50 dark:border-pink-500/30 dark:bg-pink-950/20"
                    : "border-gray-200 dark:border-gray-700 opacity-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTask(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-gray-300 text-[#FF2F92] focus:ring-[#FF2F92] accent-[#FF2F92] shrink-0"
                />
                <span className="flex-1 text-sm dark:text-gray-200 truncate">
                  {task.rawText}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${meta.badgeClass}`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                  {quadrant} {meta.label}
                </span>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="mt-5 w-full rounded-xl bg-[#FF2F92] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#e6287f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 transition-all"
        >
          {isPending
            ? "이월 중..."
            : selectedCount > 0
              ? `${selectedCount}개 이월하기`
              : "전부 버리기"}
        </button>
      </div>
    </div>
  );
}
