"use client";

import { useState } from "react";
import type { Quadrant, TaskOrigin } from "@/generated/prisma/client";
import TaskCard, { type TaskWithOrigin } from "@/components/TaskCard";
import { completeTask, discardTask } from "./actions";

type ViewMode = "list" | "matrix";

const QUADRANT_SECTIONS: { key: Quadrant; title: string; desc: string; accent: string; bg: string }[] = [
  { key: "Q1", title: "긴급 + 중요", desc: "지금 바로 하기", accent: "text-red-600", bg: "bg-red-50 border-red-100" },
  { key: "Q2", title: "중요", desc: "계획 세우기", accent: "text-[#FF2F92]", bg: "bg-pink-50 border-pink-100" },
  { key: "Q3", title: "긴급", desc: "위임하거나 빠르게", accent: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  { key: "Q4", title: "나중에", desc: "줄이거나 제거", accent: "text-gray-500", bg: "bg-gray-50 border-gray-100" },
];

export default function TodayTaskList({
  activeTasks,
  completedTasks,
}: {
  activeTasks: TaskWithOrigin[];
  completedTasks: TaskWithOrigin[];
}) {
  const [view, setView] = useState<ViewMode>("list");
  const [showCompleted, setShowCompleted] = useState(false);

  const handleComplete = async (id: string) => { await completeTask(id); };
  const handleDiscard = async (id: string) => { await discardTask(id); };

  return (
    <div>
      {/* 뷰 전환 세그먼트 */}
      <div className="flex items-center justify-between mb-5">
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === "list" ? "bg-[#FF2F92] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            리스트
          </button>
          <button
            type="button"
            onClick={() => setView("matrix")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === "matrix" ? "bg-[#FF2F92] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            사분면
          </button>
        </div>

        {/* 완료 토글 */}
        {completedTasks.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            완료 {completedTasks.length}건 {showCompleted ? "숨기기" : "보기"}
          </button>
        )}
      </div>

      {/* 리스트 뷰 */}
      {view === "list" && (
        <ListView
          activeTasks={activeTasks}
          completedTasks={showCompleted ? completedTasks : []}
          onComplete={handleComplete}
          onDiscard={handleDiscard}
        />
      )}

      {/* 사분면 뷰 */}
      {view === "matrix" && (
        <MatrixView
          activeTasks={activeTasks}
          completedTasks={showCompleted ? completedTasks : []}
          onComplete={handleComplete}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
}

/* ─── 리스트 뷰 ──────────────────────── */

function ListView({
  activeTasks,
  completedTasks,
  onComplete,
  onDiscard,
}: {
  activeTasks: TaskWithOrigin[];
  completedTasks: TaskWithOrigin[];
  onComplete: (id: string) => void;
  onDiscard: (id: string) => void;
}) {
  if (activeTasks.length === 0 && completedTasks.length === 0) {
    return (
      <p className="text-center py-10 text-gray-400 text-sm">
        진행 중인 작업이 없어요
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDiscard={onDiscard}
          />
        ))}
      </div>

      {completedTasks.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            완료됨 ({completedTasks.length})
          </p>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} isCompleted />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── 사분면 뷰 ──────────────────────── */

function MatrixView({
  activeTasks,
  completedTasks,
  onComplete,
  onDiscard,
}: {
  activeTasks: TaskWithOrigin[];
  completedTasks: TaskWithOrigin[];
  onComplete: (id: string) => void;
  onDiscard: (id: string) => void;
}) {
  const grouped = (q: Quadrant) => activeTasks.filter((t) => (t.finalQuadrant ?? t.aiQuadrant ?? "Q4") === q);
  const groupedCompleted = (q: Quadrant) => completedTasks.filter((t) => (t.finalQuadrant ?? t.aiQuadrant ?? "Q4") === q);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {QUADRANT_SECTIONS.map((section) => {
        const tasks = grouped(section.key);
        const completed = groupedCompleted(section.key);
        return (
          <div key={section.key} className={`rounded-2xl border p-4 ${section.bg}`}>
            <div className="mb-3">
              <h3 className={`text-sm font-bold ${section.accent}`}>{section.key} {section.title}</h3>
              <p className="text-[11px] text-gray-400">{section.desc}</p>
            </div>

            {tasks.length === 0 && completed.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">비어 있음</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onComplete}
                    onDiscard={onDiscard}
                    compact
                  />
                ))}
                {completed.map((task) => (
                  <TaskCard key={task.id} task={task} isCompleted compact />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
