"use client";

import { useTransition } from "react";
import type { Task, Quadrant, TaskOrigin } from "@/generated/prisma/client";

export type TaskWithOrigin = Task & { origin?: TaskOrigin };

const QUADRANT_META: Record<Quadrant, { label: string; emoji: string; badgeClass: string; dotClass: string }> = {
  Q1: { label: "긴급 + 중요", emoji: "🔴", badgeClass: "bg-red-100 text-red-700", dotClass: "bg-red-500" },
  Q2: { label: "중요", emoji: "🩷", badgeClass: "bg-pink-100 text-pink-700", dotClass: "bg-pink-500" },
  Q3: { label: "긴급", emoji: "🟡", badgeClass: "bg-amber-100 text-amber-700", dotClass: "bg-amber-500" },
  Q4: { label: "나중에", emoji: "⚪", badgeClass: "bg-gray-100 text-gray-500", dotClass: "bg-gray-400" },
};

const ORIGIN_LABELS: Partial<Record<TaskOrigin, { text: string; className: string }>> = {
  carry_over: { text: "이월", className: "bg-orange-100 text-orange-600" },
  backlog: { text: "백로그", className: "bg-purple-100 text-purple-600" },
};

export default function TaskCard({
  task,
  isCompleted,
  onComplete,
  onDiscard,
  compact = false,
}: {
  task: TaskWithOrigin;
  isCompleted?: boolean;
  onComplete?: (id: string) => void;
  onDiscard?: (id: string) => void;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const quadrant = task.finalQuadrant ?? task.aiQuadrant ?? "Q4";
  const meta = QUADRANT_META[quadrant];
  const originBadge = task.origin ? ORIGIN_LABELS[task.origin] : null;

  const handleComplete = () => {
    if (!onComplete) return;
    startTransition(() => { onComplete(task.id); });
  };

  const handleDiscard = () => {
    if (!onDiscard) return;
    if (confirm("이 작업을 폐기할까요?")) {
      startTransition(() => { onDiscard(task.id); });
    }
  };

  if (isCompleted) {
    return (
      <div className={`rounded-xl bg-white p-4 shadow-sm transition ${isPending ? "opacity-40" : "opacity-60"}`}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 line-through truncate">{task.rawText}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badgeClass}`}>{quadrant}</span>
              {task.completedAt && (
                <span className="text-[10px] text-gray-400">
                  {new Date(task.completedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-white shadow-sm hover:shadow-md transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""} ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start gap-3">
        {/* 체크 버튼 */}
        {onComplete && (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isPending}
            className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 hover:border-[#FF2F92] hover:bg-pink-50 transition-colors group disabled:opacity-40"
          >
            <span className="text-[#FF2F92] opacity-0 group-hover:opacity-100 text-xs font-bold transition-opacity">✓</span>
          </button>
        )}

        <div className="flex-1 min-w-0">
          {/* 태스크 텍스트 */}
          <p className={`text-gray-900 font-medium leading-snug ${compact ? "text-sm" : ""}`}>{task.rawText}</p>

          {/* 뱃지 행 */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {/* 사분면 뱃지 */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
              {quadrant} {meta.label}
            </span>

            {/* origin 뱃지 */}
            {originBadge && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${originBadge.className}`}>
                {originBadge.text}
              </span>
            )}

            {/* alert/review 뱃지 */}
            {task.alertAt && !task.backlogAt && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500 text-white">
                주의 필요
              </span>
            )}
            {task.needsReviewAt && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                재조정 필요
              </span>
            )}
            {task.backlogAt && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                자동 이동
              </span>
            )}
          </div>

          {/* AI 이유 */}
          {!compact && task.aiReason && (
            <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">{task.aiReason}</p>
          )}
        </div>

        {/* 폐기 버튼 */}
        {onDiscard && (
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isPending}
            className="shrink-0 mt-0.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
            title="폐기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
