"use client";

import { useRef, useEffect } from "react";

export default function TaskInput({
  disabled = false,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (rawText: string, formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (formData: FormData) => {
    const rawText = (formData.get("rawText") as string)?.trim();
    if (!rawText) return;

    formRef.current?.reset();
    inputRef.current?.focus();

    onSubmit(rawText, formData);
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
        disabled={disabled}
        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-black dark:focus:border-[#FF2F92] focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="shrink-0 rounded-lg bg-black dark:bg-[#FF2F92] px-4 py-2 text-sm font-medium text-white enabled:hover:bg-gray-800 dark:enabled:hover:bg-[#e6287f] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        추가
      </button>
    </form>
  );
}
