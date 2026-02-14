"use client";

import { useState } from "react";
import GuideModal from "./GuideModal";

interface GuideButtonProps {
  showTooltip?: boolean;
}

export default function GuideButton({ showTooltip = false }: GuideButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        aria-label="아이젠하워 매트릭스 가이드"
        title="아이젠하워 매트릭스 가이드"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600 dark:text-gray-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {showTooltip && (
        <>
          {/* 펄싱 효과를 위한 링 */}
          <div className="absolute -top-1 -right-1 h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF2F92] opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FF2F92]"></span>
          </div>

          {/* 툴팁 */}
          <div className="absolute top-0 -left-2 -translate-x-full z-20 animate-bounce-subtle">
            <div className="relative bg-[#FF2F92] text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              사용법을 확인하세요! 👈
              {/* 화살표 */}
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#FF2F92] rotate-45"></div>
            </div>
          </div>
        </>
      )}

      <GuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
