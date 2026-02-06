"use client";

import { useTransition, useState } from "react";
import { finalizeTodayPlan } from "./actions";
import LoadingButton from "@/components/LoadingButton";
import InlineError from "@/components/InlineError";

export default function FinalizeButton({ count }: { count: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <LoadingButton
        pending={isPending}
        pendingText="확정 중..."
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await finalizeTodayPlan();
            if (result?.error) setError(result.error);
          });
        }}
      >
        오늘 이걸로 할게요 ({count}개)
      </LoadingButton>
      {error && (
        <div className="mt-3">
          <InlineError message={error} />
        </div>
      )}
    </div>
  );
}
