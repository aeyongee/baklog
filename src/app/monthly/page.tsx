import { getMonthlyCompletionCount, getCompletedTasksByDate } from "./actions";
import MonthlyCalendar from "./monthly-calendar";
import Link from "next/link";

export const revalidate = 300; // 5분마다 재검증

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MonthlyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedDate = typeof params.date === "string" ? params.date : null;

  // 현재 년월 (KST 기준) 또는 query parameter에서 가져오기
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const defaultYear = kstNow.getUTCFullYear();
  const defaultMonth = kstNow.getUTCMonth() + 1;

  const year = typeof params.year === "string" ? parseInt(params.year, 10) : defaultYear;
  const month = typeof params.month === "string" ? parseInt(params.month, 10) : defaultMonth;

  // 이전/다음 달 계산
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  // 월별 완료 개수 조회
  const completionCount = await getMonthlyCompletionCount(year, month);

  // 선택된 날짜의 완료 작업 조회
  const selectedTasks = selectedDate ? await getCompletedTasksByDate(selectedDate) : [];

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">월간 현황</h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {year}년 {month}월 완료 작업 내역
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/monthly?year=${prevYear}&month=${prevMonth}`}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              ← 이전
            </Link>
            {(year !== defaultYear || month !== defaultMonth) && (
              <Link
                href="/monthly"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
              >
                오늘
              </Link>
            )}
            <Link
              href={`/monthly?year=${nextYear}&month=${nextMonth}`}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              다음 →
            </Link>
          </div>
        </div>
      </div>

      <MonthlyCalendar
        year={year}
        month={month}
        completionCount={completionCount}
        selectedDate={selectedDate}
        selectedTasks={selectedTasks}
        currentYear={defaultYear}
        currentMonth={defaultMonth}
      />
    </main>
  );
}
