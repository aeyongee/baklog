"use client";

import { useTransition } from "react";
import { manualClassifyDraftTasks } from "./actions";

export default function ManualClassifyButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await manualClassifyDraftTasks();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isPending ? "이동 중..." : "직접 분류하기"}
    </button>
  );
}
