"use client";

import { useState, useEffect, useTransition } from "react";
import { markGuideAsCompleted } from "./guide-actions";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();
  const totalSteps = 4;

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
    startTransition(async () => {
      await markGuideAsCompleted();
      onClose();
      // 페이지 새로고침하여 툴팁 숨김
      window.location.reload();
    });
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
            {step === 0 && "❓ 왜 우리는 항상 바쁠까요?"}
            {step === 1 && "💡 이것만 기억하세요"}
            {step === 2 && "🔍 4개의 사분면 (Q1 ~ Q4)"}
            {step === 3 && "✅ 이렇게 사용하세요"}
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
        <div className="relative overflow-hidden min-h-[380px]">
          <div
            className="flex transition-transform duration-300 ease-in-out min-h-[380px]"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {/* PAGE 1: 문제 인식 */}
            <div className="min-w-full px-5 py-6">
              <div className="space-y-5">
                <div className="space-y-3 text-center">
                  <br />
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    중요한 일을 하려는데
                  </p>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    갑자기 들어온 요청과 알림에 밀려
                  </p>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    하루가 끝나버린 적 있나요?
                  </p>
                </div>

                <br />

                <div
                  className="my-4 border-t border-gray-300/60 dark:border-gray-600/40 w-2/3 mx-auto"
                  style={{ opacity: 0.7 }}
                ></div>

                <br />

                <div className="space-y-3 text-center">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    긴급한 일은 항상 중요해 보입니다.
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    하지만 대부분은 그렇지 않습니다.
                  </p>
                </div>

                <div className="mt-9 bg-[#FF2F92]/10 dark:bg-[#FF2F92]/20 rounded-xl p-4 border border-[#FF2F92]/30">
                  <p className="text-sm text-center text-gray-700 dark:text-gray-300 leading-relaxed">
                    Baklog는{" "}
                    <span className="font-bold text-[#FF2F92]">
                      긴급함의 착각
                    </span>
                    에 빠지지 않기 위해 만들어졌습니다 😀
                  </p>
                </div>
              </div>
            </div>

            {/* PAGE 2: 판단 기준 */}
            <div className="min-w-full px-5 py-6">
              <div className="space-y-5">
                <div className="space-y-4">
                  {/* 질문 1 */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                    <p className="text-sl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      <strong>질문 1</strong>
                    </p>
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      이 일을 하지 않으면
                      <br />
                      1주일 또는 그 이상 뒤에 문제가 생기나요?
                    </p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      → YES = 중요
                    </p>
                  </div>

                  {/* 질문 2 */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800">
                    <p className="text-sl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      <strong>질문 2</strong>
                    </p>
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      오늘 안 하면
                      <br />나 또는 누군가가 곤란해지나요?
                    </p>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      → YES = 긴급
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-center text-gray-700 dark:text-gray-300">
                    이 두 질문으로 대부분의 작업을 분류할 수 있어요 ❗️
                  </p>
                </div>
              </div>
            </div>

            {/* PAGE 3: 4개 사분면 */}
            <div className="min-w-full px-3 h-[450px] flex items-center justify-center">
              <div className="grid grid-cols-2 gap-2 w-full auto-rows-fr">
                {/* Q1 */}
                <div className="border-2 border-red-300 dark:border-red-700 rounded-xl p-4 bg-red-50 dark:bg-red-900/20 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold text-red-700 dark:text-red-400">
                      Q1 🚨
                    </span>
                  </div>
                  <p className="text-sl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    중요하고 긴급한 일
                  </p>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>• 지금 당장 해결하지 않으면 문제가 커지는 일</p>
                    <p>• 빠르게 처리하세요!</p>
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      👉 이 영역이 많다면 구조 점검이 필요
                    </p>
                  </div>
                </div>

                {/* Q2 */}
                <div className="border-2 border-[#FF2F92]/40 dark:border-[#FF2F92]/60 rounded-xl p-4 bg-[#FF2F92]/10 dark:bg-[#FF2F92]/20 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold text-[#FF2F92] dark:text-[#FF2F92]">
                      Q2 ⭐️
                    </span>
                  </div>
                  <p className="text-sl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    중요하지만 긴급하지 않은 일
                  </p>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p className="font-bold text-[#FF2F92] dark:text-[#FF2F92]">
                      • Baklog의 핵심 영역
                    </p>
                    <p>• 일정 관리와 집중이 필요한 일</p>
                    <p className="font-medium">
                      • 남는 시간에 하는 일이 아닙니다 🙅‍♂️
                    </p>
                  </div>
                </div>

                {/* Q3 */}
                <div className="border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/20 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold text-yellow-700 dark:text-yellow-400">
                      Q3 💣
                    </span>
                  </div>
                  <p className="text-sl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    중요하지 않지만 긴급해 보이는 일
                  </p>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>• 급해 보여도, 꼭 내가 해야 하는 일인가?</p>
                    <p>• 빠르게 쳐내거나 위임하세요</p>
                    <p>• 중요하다고 착각하기 쉬운 일입니다 🙄</p>
                  </div>
                </div>

                {/* Q4 */}
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold text-gray-700 dark:text-gray-400">
                      Q4 🧹
                    </span>
                  </div>
                  <p className="text-sl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    중요하지도 긴급하지도 않은 일
                  </p>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-400">
                    <p>• 안 해도 아무 일도 일어나지 않는 일</p>
                    <p>• 과감히 버리세요! 🗑️</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 4: 운영 원칙 */}
            <div className="min-w-full px-5 py-6">
              <div className="space-y-5">
                <div className="space-y-3">
                  {/* 체크리스트 */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <p className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          ✓
                        </span>
                        Q2는 하루 1~2개만 잡아요.
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          ✓
                        </span>
                        Q1이 3개 이상이면 Q2를 미뤘다는 신호예요.
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          ✓
                        </span>
                        Q3는 하루 한 번 묶어서 처리해요.
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 font-bold">
                          ⚠️
                        </span>
                        <span className="font-medium">
                          Q2를 미루면 Q1이 됩니다.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-[#FF2F92]/10 dark:bg-[#FF2F92]/20 rounded-xl p-5 border-2 border-[#FF2F92]/30">
                  <p className="text-base text-center font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
                    목표는 더 많이 하는 것이 아니라,
                    <br />
                    중요한 일을 지키는 것입니다 ✨
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
