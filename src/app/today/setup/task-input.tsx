"use client";

import { useRef } from "react";
import { addTask } from "./actions";

export default function TaskInput() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addTask(formData);
        formRef.current?.reset();
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        name="rawText"
        placeholder="작업을 입력하세요"
        autoComplete="off"
        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-black dark:focus:border-[#FF2F92] focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-black dark:bg-[#FF2F92] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:hover:bg-[#e6287f]"
      >
        추가
      </button>
    </form>
  );
}
