"use client";

import { useState, useEffect } from "react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [step, setStep] = useState(0);
  const totalSteps = 3;

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // 키보드 네비게이션 (←/→)
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && step > 0) {
        setStep(step - 1);
      } else if (e.key === "ArrowRight" && step < totalSteps - 1) {
        setStep(step + 1);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyNav);
      return () => document.removeEventListener("keydown", handleKeyNav);
    }
  }, [isOpen, step]);

  // 모달이 닫힐 때 step 초기화
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setStep(0), 300); // 애니메이션 후 초기화
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold dark:text-gray-100">
            {step === 0 && "아이젠하워 매트릭스란?"}
            {step === 1 && "4개의 사분면"}
            {step === 2 && "효과적으로 사용하기"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content with slide animation */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {/* Step 1: 개념 소개 */}
            <div className="min-w-full px-5 py-6">
              <div className="space-y-4">
                {/* 아이젠하워 매트릭스 개념 */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                        우리에게 주어진 시간을 {""}
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                          4분할
                        </span>
                        로 나누어 처리하는 방법입니다 😁
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        모든 사람에게 하루는 24시간이므로, 어떻게 시간을
                        배분하느냐가 성과를 결정합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 중요도 x 긴급도 */}
                <div className="bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-pink-100 dark:border-pink-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#FF2F92] flex items-center justify-center shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="12" y1="3" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        중요도 × 긴급도
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        두 축으로 우리가 처리해야 할 일을 분류합니다 ❗️
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        중요도 (Important)
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        내 목표/가치/성과에 장기적으로 크게 영향을 미치는 일
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        긴급도 (Urgent)
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        시간이 지나면 가치가 크게 떨어지고, 피해가 커지는 일
                      </p>
                    </div>
                  </div>
                </div>

                <br></br>

                {/* 핵심 */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">💡 핵심:</span> 집중해야 할
                    일과 미뤄도 되는 일을 구분하여, 더 효율적인 시간 관리를 할
                    수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: 사분면 설명 */}
            <div className="min-w-full px-5 py-6">
              <div className="space-y-4">
                {/* Matrix Visualization */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Q1 */}
                  <div className="border-2 border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-red-700 dark:text-red-400">
                        Q1
                      </span>
                      <span className="text-sm text-red-600 dark:text-red-400">
                        🚨 중요 + 긴급
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300 mb-2">
                      <li>✔ 마감 임박</li>
                      <li>✔ 안하면 피해 발생</li>
                      <li>✔ 이미 문제 발생 중</li>
                    </ul>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      👉 즉시 처리
                    </p>
                  </div>

                  {/* Q2 */}
                  <div className="border-2 border-pink-300 dark:border-pink-700 rounded-lg p-4 bg-pink-50 dark:bg-pink-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-pink-700 dark:text-pink-400">
                        Q2
                      </span>
                      <span className="text-xs text-pink-600 dark:text-pink-400">
                        중요 + 비긴급
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300 mb-2">
                      <li>✔ 장기 목표에 기여</li>
                      <li>✔ 성장/공부/건강</li>
                      <li>⚠ 미루면 Q1됨</li>
                    </ul>
                    <p className="text-xs font-semibold text-pink-700 dark:text-pink-400">
                      👉 일정에 고정
                    </p>
                  </div>

                  {/* Q3 */}
                  <div className="border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        Q3
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        덜중요 + 긴급
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300 mb-2">
                      <li>✔ 누군가 재촉함</li>
                      <li>✔ 요청/전화/메시지</li>
                      <li>✖ 장기 가치 낮음</li>
                    </ul>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      👉 위임/거절/짧게
                    </p>
                  </div>

                  {/* Q4 */}
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-700 dark:text-gray-400">
                        Q4
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        덜중요 + 비긴급
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-400 mb-2">
                      <li>✔ 시간 보내기용</li>
                      <li>✔ 안 해도 문제 없음</li>
                      <li>✔ 의미 없는 소비</li>
                    </ul>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-400">
                      👉 제거/제한
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-900 dark:text-purple-200 font-medium mb-2">
                    🎯 이상적인 시간 배분
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Q2 (중요)
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        60%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Q1 (위기)
                      </span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        20%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Q3 (방해)
                      </span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        15%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Q4 (낭비)
                      </span>
                      <span className="font-bold text-gray-600 dark:text-gray-400">
                        5%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: 사용 팁 */}
            <div className="min-w-full px-5 py-6">
              <div className="space-y-4">
                <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🤖</span>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      AI가 먼저 분류하지만
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    당신이 더 잘 알아요. AI 분류 결과를 확인하고 중요도/긴급도
                    토글로 조정하세요.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <span className="text-xl">💎</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Q2 작업을 늘리세요
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        중요하지만 긴급하지 않은 일에 시간을 투자하면,
                        위기(Q1)가 줄어듭니다. 장기적으로 가장 높은 가치를
                        만듭니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <span className="text-xl">⚡</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Q3는 최소화하세요
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        긴급해 보이지만 중요하지 않은 일들. 위임하거나
                        거절하거나, 최소한의 시간만 투자하세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <span className="text-xl">🗑️</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Q4는 과감하게 제거
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        중요하지도 긴급하지도 않은 일. 시간 낭비입니다. 용기
                        있게 삭제하세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-semibold text-pink-700 dark:text-pink-400">
                      ✨ 기억하세요:
                    </span>{" "}
                    바쁜 것과 생산적인 것은 다릅니다. Q2에 집중하는 사람이
                    장기적으로 성공합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 py-3 border-t dark:border-gray-700">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-[#FF2F92]"
                  : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
              aria-label={`${i + 1}단계로 이동`}
            />
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-4 border-t dark:border-gray-700 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              step === 0
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            이전
          </button>

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#FF2F92] text-white hover:bg-[#E02882] transition-colors"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#FF2F92] text-white hover:bg-[#E02882] transition-colors"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
