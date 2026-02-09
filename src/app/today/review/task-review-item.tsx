"use client";

import { updateTaskClassification, updateTaskCategory } from "./actions";
import { useState, useTransition } from "react";
import type { Quadrant } from "@prisma/client";

type Task = {
  id: string;
  rawText: string;
  aiImportance: number | null;
  aiUrgency: number | null;
  aiQuadrant: Quadrant | null;
  aiConfidence: number | null;
  aiReason: string | null;
  finalImportant: boolean | null;
  finalUrgent: boolean | null;
  finalQuadrant: Quadrant | null;
  category: string | null;
};

const QUADRANT_LABELS: Record<Quadrant, string> = {
  Q1: "긴급하고 중요",
  Q2: "중요하지만 긴급하지 않음",
  Q3: "긴급하지만 중요하지 않음",
  Q4: "긴급하지도 중요하지도 않음",
};

const QUADRANT_COLORS: Record<Quadrant, string> = {
  Q1: "bg-red-100 text-red-800 border-red-300",
  Q2: "bg-blue-100 text-blue-800 border-blue-300",
  Q3: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Q4: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function TaskReviewItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  // AI 결과를 기본값으로 사용, 사용자가 수정한 경우 그 값 사용
  const currentImportant = task.finalImportant ?? (task.aiImportance ?? 0) > 0.5;
  const currentUrgent = task.finalUrgent ?? (task.aiUrgency ?? 0) > 0.5;

  const isManual = !task.aiQuadrant;
  const currentCategory = task.category;

  const handleCategoryToggle = (cat: "work" | "personal") => {
    const newCat = currentCategory === cat ? null : cat;
    startTransition(async () => {
      await updateTaskCategory(task.id, newCat);
    });
  };

  const handleToggle = (field: "important" | "urgent") => {
    const newImportant = field === "important" ? !currentImportant : currentImportant;
    const newUrgent = field === "urgent" ? !currentUrgent : currentUrgent;

    startTransition(async () => {
      await updateTaskClassification(task.id, newImportant, newUrgent);
    });
  };

  // 현재 quadrant 계산
  let currentQuadrant: Quadrant;
  if (currentImportant && currentUrgent) currentQuadrant = "Q1";
  else if (currentImportant && !currentUrgent) currentQuadrant = "Q2";
  else if (!currentImportant && currentUrgent) currentQuadrant = "Q3";
  else currentQuadrant = "Q4";

  return (
    <div
      className={`border-2 rounded-lg p-4 transition ${QUADRANT_COLORS[currentQuadrant]} ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-gray-900 font-medium flex-1">{task.rawText}</p>
        <span className="text-xs font-semibold px-2 py-1 rounded shrink-0">
          {currentQuadrant}
        </span>
      </div>

      <div className="text-sm text-gray-700 mb-3">
        <p className="font-medium">{QUADRANT_LABELS[currentQuadrant]}</p>
        {task.aiReason && (
          <p className="text-xs text-gray-600 mt-1">이유: {task.aiReason}</p>
        )}
        {task.aiConfidence !== null && (
          <p className="text-xs text-gray-500 mt-1">
            신뢰도: {Math.round(task.aiConfidence * 100)}%
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleToggle("important")}
          disabled={isPending}
          className={`flex-1 py-2 px-3 rounded font-medium text-sm transition ${
            currentImportant
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
        >
          {currentImportant ? "✓ 중요함" : "중요함"}
        </button>

        <button
          type="button"
          onClick={() => handleToggle("urgent")}
          disabled={isPending}
          className={`flex-1 py-2 px-3 rounded font-medium text-sm transition ${
            currentUrgent
              ? "bg-red-600 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
        >
          {currentUrgent ? "✓ 긴급함" : "긴급함"}
        </button>
      </div>

      {isManual && (
        <div className="mt-3 flex justify-end"><div className="inline-flex rounded-lg bg-white/60 p-0.5 border border-gray-200">
          <button
            type="button"
            onClick={() => handleCategoryToggle("work")}
            disabled={isPending}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              currentCategory === "work"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            업무
          </button>
          <button
            type="button"
            onClick={() => handleCategoryToggle("personal")}
            disabled={isPending}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              currentCategory === "personal"
                ? "bg-green-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            개인
          </button>
        </div></div>
      )}
    </div>
  );
}
