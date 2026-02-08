import { getTodayTasks, getBacklogNotifications } from "./actions";
import { getCarryOverPreview } from "./setup/actions";
import TodayTaskList from "./task-list";
import AlertSection from "./alert-section";
import ReviewSection from "./review-section";
import BacklogNotification from "./backlog-notification";
import EmptyState from "@/components/EmptyState";
import { redirect } from "next/navigation";

// 5분마다 재검증 (캐싱)
export const revalidate = 300;

export default async function TodayDashboard() {
  // 이월 대상 작업이 있으면 setup 페이지로 리다이렉트
  const carryOverTasks = await getCarryOverPreview();
  if (carryOverTasks.length > 0) {
    redirect("/today/setup");
  }

  const [data, backlogNotifications] = await Promise.all([
    getTodayTasks(),
    getBacklogNotifications(),
  ]);

  if (!data || (data.activeTasks.length === 0 && data.completedTasks.length === 0)) {
    return (
      <main className="p-4 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">오늘의 작업</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            하루를 계획하고 중요한 일에 집중하세요
          </p>
        </div>

        <BacklogNotification tasks={backlogNotifications} />

        <EmptyState
          title="오늘은 비교적 한가하네요"
          description="할 일을 추가하고 AI에게 분류를 맡겨보세요."
          actionLabel="할 일 추가하기"
          actionHref="/today/setup"
        />
      </main>
    );
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">오늘의 작업</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          진행 중 <span className="font-semibold text-gray-600 dark:text-gray-400">{data.activeTasks.length}</span>개
          {data.completedTasks.length > 0 && (
            <> · 완료 <span className="font-semibold text-gray-600 dark:text-gray-400">{data.completedTasks.length}</span>개</>
          )}
        </p>
      </div>

      <AlertSection tasks={data.alertTasks} />
      <ReviewSection tasks={data.reviewTasks} />
      <BacklogNotification tasks={backlogNotifications} />

      <TodayTaskList
        activeTasks={data.activeTasks}
        completedTasks={data.completedTasks}
      />
    </main>
  );
}
