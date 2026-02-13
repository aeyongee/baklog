"use client";

import { addTaskToTodayAndRedirect, deleteBacklogTask } from "./actions";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Task, Quadrant } from "@prisma/client";
import ConfirmDialog from "@/components/ConfirmDialog";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleAddClick = () => {
    setShowAddConfirm(true);
  };

  const handleAddConfirm = () => {
    startTransition(async () => {
      await addTaskToTodayAndRedirect(task.id);
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteBacklogTask(task.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("작업 삭제에 실패했습니다.");
      setIsDeleting(false);
    }
  };

  const quadrant = task.finalQuadrant ?? task.aiQuadrant;
  const createdDate = new Date(task.createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <div className={`rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-all ${isPending || isDeleting ? "opacity-40 scale-[0.98]" : ""}`}>
        <div className="flex flex-col">
          {/* 작업 내용 */}
          <div className="flex-1">
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
            </div>

            {task.aiReason && (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{task.aiReason}</p>
            )}
          </div>

          {/* O, X 버튼 - 우측 하단 */}
          <div className="flex justify-end items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleAddClick}
              disabled={isPending || isDeleting}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold text-lg"
              aria-label="오늘 할 일로 이동"
              title="오늘 할 일로 이동"
            >
              O
            </button>
            
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isPending || isDeleting}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold text-lg"
              aria-label="백로그에서 삭제"
              title="백로그에서 삭제"
            >
              X
            </button>
          </div>
        </div>
      </div>

      {/* 오늘 할 일로 이동 확인 대화상자 */}
      <ConfirmDialog
        open={showAddConfirm}
        onOpenChange={setShowAddConfirm}
        title="오늘 할 일로 이동"
        description="이 작업을 오늘 할 일로 이동하시겠습니까?"
        confirmText="이동"
        cancelText="취소"
        onConfirm={handleAddConfirm}
        variant="primary"
      />

      {/* 삭제 확인 대화상자 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="작업 삭제"
        description="백로그에서 이 작업을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </>
  );
}
