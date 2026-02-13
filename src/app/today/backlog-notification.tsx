"use client";

import { useTransition } from "react";
import { addTaskToToday } from "@/app/backlog/actions";
import { discardTask } from "./actions";
import type { Task } from "@prisma/client";
import Link from "next/link";

type BacklogTask = Task & { daysInBacklog: number };

export default function BacklogNotification({
  tasks,
}: {
  tasks: BacklogTask[];
}) {
  if (tasks.length === 0) return null;

  const alertTasks = tasks.filter((t) => t.alertAt !== null);
  const newTasks = tasks.filter((t) => t.daysInBacklog === 0 && !t.alertAt);
  const normalStaleTasks = tasks.filter((t) => t.daysInBacklog > 0 && !t.alertAt);

  return (
    <div className="mb-5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <h2 className="text-sm font-bold text-purple-700 dark:text-purple-400">
            백로그에 작업이 쌓이고 있어요 ({tasks.length})
          </h2>
        </div>
        <Link
          href="/backlog"
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
        >
          전체 보기
        </Link>
      </div>

      {alertTasks.length > 0 && (
        <>
          <p className="text-xs text-red-600 dark:text-red-400/80 mb-3 font-semibold">
            중요한 작업이 백로그에 오래 머물고 있어요!
          </p>
          <div className="space-y-2 mb-3">
            {alertTasks.map((task) => (
              <BacklogNotificationItem key={task.id} task={task} isAlert />
            ))}
          </div>
        </>
      )}

      {newTasks.length > 0 && (
        <>
          <p className="text-xs text-purple-600 dark:text-purple-400/80 mb-3">
            오늘 새로 백로그로 이동된 작업이에요.
          </p>
          <div className="space-y-2 mb-3">
            {newTasks.map((task) => (
              <BacklogNotificationItem key={task.id} task={task} isNew />
            ))}
          </div>
        </>
      )}

      {normalStaleTasks.length > 0 && (
        <>
          <p className="text-xs text-purple-600 dark:text-purple-400/80 mb-3">
            {(newTasks.length > 0 || alertTasks.length > 0)
              ? "이전에 이동된 작업도 쌓여있어요."
              : "백로그에 쌓인 채 처리되지 않은 작업이에요."}
          </p>
          <div className="space-y-2">
            {normalStaleTasks.map((task) => (
              <BacklogNotificationItem key={task.id} task={task} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BacklogNotificationItem({
  task,
  isNew = false,
  isAlert = false,
}: {
  task: BacklogTask;
  isNew?: boolean;
  isAlert?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={`rounded-xl p-3 shadow-sm transition-all ${isPending ? "opacity-40 scale-[0.98]" : ""} ${
        isAlert
          ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30"
          : "bg-white dark:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <p className="flex-1 font-medium text-gray-900 dark:text-gray-100 text-sm">
          {task.rawText}
        </p>
        {isAlert ? (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500 text-white">
            {task.daysInBacklog}일째 방치
          </span>
        ) : isNew ? (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500 text-white">
            오늘 이동
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {task.daysInBacklog}일째
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await addTaskToToday(task.id);
            })
          }
          disabled={isPending}
          className="flex-1 rounded-lg bg-purple-500 text-white text-xs font-semibold px-3 py-2 hover:bg-purple-600 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          오늘 하기
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("이 작업을 폐기할까요?")) {
              startTransition(async () => {
                await discardTask(task.id);
              });
            }
          }}
          disabled={isPending}
          className="flex-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 text-xs font-semibold px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          안 할래요
        </button>
      </div>
    </div>
  );
}
