"use client";

import { useRef, useEffect, useTransition } from "react";
import { addTask } from "./actions";
import { useRouter } from "next/navigation";

export default function TaskInput({ disabled = false }: { disabled?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // disabled 해제 시 자동 포커스 복원
  useEffect(() => {
    if (!disabled && !isPending) {
      inputRef.current?.focus();
    }
  }, [disabled, isPending]);

  const handleSubmit = async (formData: FormData) => {
    const rawText = formData.get("rawText") as string;
    if (!rawText?.trim()) return;

    // 즉시 입력 필드 초기화 + 포커스 복원
    formRef.current?.reset();
    inputRef.current?.focus();

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
        autoFocus
        autoComplete="off"
        disabled={isPending || disabled}
        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-black dark:focus:border-[#FF2F92] focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isPending || disabled}
        className="shrink-0 rounded-lg bg-black dark:bg-[#FF2F92] px-4 py-2 text-sm font-medium text-white enabled:hover:bg-gray-800 dark:enabled:hover:bg-[#e6287f] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "추가 중..." : "추가"}
      </button>
    </form>
  );
}
