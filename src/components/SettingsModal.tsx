"use client";

import { useState, useTransition } from "react";
import { updateDefaultView } from "@/app/today/actions";

export default function SettingsModal({
  name,
  email,
  image,
  onClose,
}: {
  name: string;
  email: string;
  image?: string;
  onClose: () => void;
}) {
  const [defaultView, setDefaultView] = useState<"list" | "matrix">("list");
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  // Load current preference on mount
  if (!loaded) {
    setLoaded(true);
    // We'll read from localStorage as a quick sync, server action handles persistence
    const saved = typeof window !== "undefined" ? localStorage.getItem("baklog-default-view") : null;
    if (saved === "matrix") setDefaultView("matrix");
  }

  const handleViewChange = (view: "list" | "matrix") => {
    setDefaultView(view);
    if (typeof window !== "undefined") {
      localStorage.setItem("baklog-default-view", view);
    }
    startTransition(async () => {
      await updateDefaultView(view);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold dark:text-gray-100">설정</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* 계정 정보 */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">계정</p>
          <div className="flex items-center gap-3">
            {image ? (
              <img src={image} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-500">
                {name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium dark:text-gray-100">{name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Google 로그인</p>
        </div>

        {/* 기본 뷰 설정 */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">기본 보기</p>
          <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              disabled={isPending}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                defaultView === "list"
                  ? "bg-[#FF2F92] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              리스트
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("matrix")}
              disabled={isPending}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                defaultView === "matrix"
                  ? "bg-[#FF2F92] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              사분면
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
