"use client";

import { useRef, useTransition } from "react";
import { addTask } from "./actions";
import { useRouter } from "next/navigation";

export default function TaskInput() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    const rawText = formData.get("rawText") as string;
    if (!rawText?.trim()) return;

    // 즉시 입력 필드 초기화 (빠른 피드백)
    formRef.current?.reset();
    
    startTransition(async () => {
      await addTask(formData);
      // 캐시만 무효화 (빠름)
      router.refresh();
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex gap-2"
    >
      <input
        ref={inputRef}
        type="text"
        name="rawText"
        placeholder="작업을 입력하세요"
        autoComplete="off"
        disabled={isPending}
        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-black dark:focus:border-[#FF2F92] focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-lg bg-black dark:bg-[#FF2F92] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:hover:bg-[#e6287f] disabled:opacity-50"
      >
        {isPending ? "추가 중..." : "추가"}
      </button>
    </form>
  );
}
