"use client";

import Link from "next/link";
import type { Task, Quadrant } from "@prisma/client";

const QUADRANT_COLORS: Record<Quadrant, string> = {
  Q1: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  Q2: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  Q3: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  Q4: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
};

interface MonthlyCalendarProps {
  year: number;
  month: number;
  completionCount: Record<string, number>;
  selectedDate: string | null;
  selectedTasks: Task[];
  currentYear: number;
  currentMonth: number;
}

export default function MonthlyCalendar({
  year,
  month,
  completionCount,
  selectedDate,
  selectedTasks,
  currentYear,
  currentMonth,
}: MonthlyCalendarProps) {
  // 달력 생성
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 (일요일) ~ 6 (토요일)

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(startDayOfWeek).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-6">
      {/* 달력 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={`${year}-${month}-week-${weekIndex}`} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`${year}-${month}-empty-${weekIndex}-${dayIndex}`} className="aspect-square" />;
                }

                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const count = completionCount[dateStr] || 0;
                const isSelected = selectedDate === dateStr;
                
                // 오늘 날짜 체크 (KST 기준)
                const now = new Date();
                const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
                const todayStr = kstNow.toISOString().split("T")[0];
                const isToday = todayStr === dateStr;

                // 현재 보고 있는 년월과 기본 년월이 다르면 year, month 파라미터 유지
                const isCurrentMonth = year === currentYear && month === currentMonth;
                const linkHref = isCurrentMonth
                  ? `/monthly?date=${dateStr}`
                  : `/monthly?date=${dateStr}&year=${year}&month=${month}`;

                return (
                  <Link
                    key={`${year}-${month}-${day}`}
                    href={linkHref}
                    className={`
                      aspect-square rounded-lg border transition flex flex-col items-center justify-center p-1
                      ${isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }
                      ${isToday && !isSelected ? "border-blue-300 dark:border-blue-700" : ""}
                    `}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {day}
                    </span>
                    {count > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {count}개
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 날짜의 완료 작업 */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedDate} 완료 작업
            </h2>
            <Link
              href={
                year === currentYear && month === currentMonth
                  ? "/monthly"
                  : `/monthly?year=${year}&month=${month}`
              }
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              닫기
            </Link>
          </div>

          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              완료된 작업이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => {
                const quadrant = task.finalQuadrant ?? task.aiQuadrant;
                const completedTime = task.completedAt
                  ? new Date(task.completedAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {task.rawText}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {completedTime && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {completedTime}
                          </span>
                        )}
                        {quadrant && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${QUADRANT_COLORS[quadrant]}`}
                          >
                            {quadrant}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
