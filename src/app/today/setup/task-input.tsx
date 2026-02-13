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
        placeholder="할 일을 입력하세요..."
        autoFocus
        autoComplete="off"
        disabled={disabled}
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#FF2F92] focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-[#FF2F92]"
      />
      <button
        type="submit"
        disabled={disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF2F92] text-lg font-bold text-white transition-colors enabled:hover:bg-[#e6287f] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="추가"
      >
        +
      </button>
    </form>
  );
}
