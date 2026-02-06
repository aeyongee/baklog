"use client";

import { useTransition, useState, useCallback } from "react";
import { classifyDraftTasks } from "./actions";
import LoadingButton from "@/components/LoadingButton";
import InlineError from "@/components/InlineError";

export default function ClassifyButton({
  disabled,
  onPendingChange,
}: {
  disabled: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);

  const handleClassify = useCallback(() => {
    setError(null);
    onPendingChange?.(true);
    startTransition(async () => {
      const result = await classifyDraftTasks();
      if (result?.error) setError(result.error);
      onPendingChange?.(false);
    });
  }, [onPendingChange]);

  const handleRetry = useCallback(() => {
    if (retried) return;
    setRetried(true);
    handleClassify();
  }, [retried, handleClassify]);

  return (
    <div>
      <LoadingButton
        pending={isPending}
        disabled={disabled}
        pendingText="AI 분류 중..."
        onClick={handleClassify}
      >
        AI 분류하기
      </LoadingButton>
      {error && (
        <div className="mt-3">
          <InlineError
            message={error}
            onRetry={retried ? undefined : handleRetry}
          />
        </div>
      )}
    </div>
  );
}
