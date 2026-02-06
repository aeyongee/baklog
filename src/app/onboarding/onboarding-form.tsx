"use client";

import { useState, useTransition } from "react";
import { submitOnboarding } from "./actions";
import type { SurveyAnswers } from "@/lib/ai/buildCustomPrompt";

const STEPS = [
  {
    question: "주로 어떤 용도로 사용하시나요?",
    key: "purpose" as const,
    multi: false,
    options: [
      { value: "work", label: "업무 중심" },
      { value: "personal", label: "개인 생활 중심" },
      { value: "mixed", label: "업무 + 개인 혼합" },
    ],
  },
  {
    question: "당신의 성향은?",
    key: "personality" as const,
    multi: false,
    options: [
      { value: "J", label: "계획을 세우고 따르는 편" },
      { value: "P", label: "상황에 따라 유연하게 대응하는 편" },
    ],
  },
  {
    question: "나에게 중요한 일이란?",
    subtitle: "복수 선택 가능",
    key: "importanceCriteria" as const,
    multi: true,
    options: [
      { value: "scheduled", label: "시간이 정해진 일정/미팅" },
      { value: "work_related", label: "회사/업무 관련 작업" },
      { value: "meaningful", label: "내가 좋아하고 의미있는 일" },
      { value: "impact_result", label: "성과/결과에 직접 영향을 주는 일" },
      { value: "impact_others", label: "다른 사람에게 영향을 미치는 일" },
    ],
  },
  {
    question: "긴급하다고 느끼는 일이란?",
    subtitle: "복수 선택 가능",
    key: "urgencyCriteria" as const,
    multi: true,
    options: [
      { value: "deadline_soon", label: "마감이 오늘/내일인 일" },
      { value: "others_waiting", label: "다른 사람이 기다리고 있는 일" },
      { value: "penalty", label: "안 하면 불이익이 생기는 일" },
      { value: "fixed_time", label: "약속/미팅 시간이 정해진 일" },
    ],
  },
  {
    question: "어떤 일부터 처리하시나요?",
    key: "workStyle" as const,
    multi: false,
    options: [
      { value: "big_first", label: "큰 일 먼저 처리" },
      { value: "small_first", label: "작은 일 먼저 처리" },
      { value: "urgent_first", label: "긴급한 일 먼저 처리" },
    ],
  },
];

export default function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isPending, startTransition] = useTransition();

  const current = STEPS[step];
  const totalSteps = STEPS.length;
  const selected = answers[current.key];

  function handleSelect(value: string) {
    if (current.multi) {
      const prev = (answers[current.key] as string[]) || [];
      const next = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      setAnswers({ ...answers, [current.key]: next });
    } else {
      setAnswers({ ...answers, [current.key]: value });
    }
  }

  function isSelected(value: string): boolean {
    if (current.multi) {
      return ((selected as string[]) || []).includes(value);
    }
    return selected === value;
  }

  function canProceed(): boolean {
    if (!selected) return false;
    if (current.multi) return (selected as string[]).length > 0;
    return true;
  }

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      startTransition(async () => {
        await submitOnboarding(answers as unknown as SurveyAnswers);
      });
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{step + 1} / {totalSteps}</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-xl font-bold dark:text-gray-100">
          {current.question}
        </h2>
        {current.subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {current.subtitle}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex-1 space-y-3">
        {current.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ${
              isSelected(option.value)
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-400"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || isPending}
          className="flex-1 rounded-xl bg-blue-500 px-6 py-3 text-sm font-medium text-white disabled:opacity-40 dark:bg-blue-600"
        >
          {isPending
            ? "저장 중..."
            : step < totalSteps - 1
              ? "다음"
              : "시작하기"}
        </button>
      </div>
    </div>
  );
}
