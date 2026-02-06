"use client";

import { useState, useCallback } from "react";
import type { Quadrant } from "@prisma/client";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import TaskCard, { type TaskWithOrigin } from "@/components/TaskCard";
import { completeTask, discardTask, moveTaskToQuadrant } from "./actions";

type ViewMode = "list" | "matrix";

const QUADRANT_SECTIONS: { key: Quadrant; title: string; desc: string; accent: string; bg: string }[] = [
  { key: "Q1", title: "🔥 지금 당장", desc: "오늘 꼭 해야 할 일", accent: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30" },
  { key: "Q2", title: "📅 계획적으로", desc: "중요하지만 여유있게", accent: "text-[#FF2F92] dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/30" },
  { key: "Q3", title: "⏰ 빠르게 처리", desc: "급하긴 한데 크게 중요하진 않음", accent: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" },
  { key: "Q4", title: "🧹 여유 있을 때", desc: "시간 나면 하기", accent: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700" },
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

/* ─── 사분면 뷰 (DnD) ──────────────────────── */

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  const grouped = (q: Quadrant) => activeTasks.filter((t) => (t.finalQuadrant ?? t.aiQuadrant ?? "Q4") === q);
  const groupedCompleted = (q: Quadrant) => completedTasks.filter((t) => (t.finalQuadrant ?? t.aiQuadrant ?? "Q4") === q);

  const activeTask = activeId ? activeTasks.find((t) => t.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetQuadrant = over.id as Quadrant;
    const task = activeTasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentQuadrant = task.finalQuadrant ?? task.aiQuadrant ?? "Q4";
    if (currentQuadrant === targetQuadrant) return;

    moveTaskToQuadrant(taskId, targetQuadrant);
  }, [activeTasks]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUADRANT_SECTIONS.map((section) => {
          const tasks = grouped(section.key);
          const completed = groupedCompleted(section.key);
          return (
            <DroppableQuadrant key={section.key} section={section}>
              {tasks.length === 0 && completed.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">비어 있음</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <DraggableTaskCard key={task.id} taskId={task.id} isDragging={activeId === task.id}>
                      <TaskCard
                        task={task}
                        onComplete={onComplete}
                        onDiscard={onDiscard}
                        compact
                      />
                    </DraggableTaskCard>
                  ))}
                  {completed.map((task) => (
                    <TaskCard key={task.id} task={task} isCompleted compact />
                  ))}
                </div>
              )}
            </DroppableQuadrant>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="shadow-lg rotate-2 opacity-90">
            <TaskCard task={activeTask} compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─── DnD 컴포넌트 ──────────────────────── */

function DroppableQuadrant({
  section,
  children,
}: {
  section: (typeof QUADRANT_SECTIONS)[number];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: section.key });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-4 transition-all ${section.bg} ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="mb-3">
        <h3 className={`text-sm font-bold ${section.accent}`}>{section.title}</h3>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{section.desc}</p>
      </div>
      {children}
    </div>
  );
}

function DraggableTaskCard({
  taskId,
  isDragging,
  children,
}: {
  taskId: string;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: taskId });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`transition-opacity ${isDragging ? "opacity-30" : ""}`}
    >
      {children}
    </div>
  );
}
