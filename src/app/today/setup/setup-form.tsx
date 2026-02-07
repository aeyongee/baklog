"use client";

import { useState } from "react";
import TaskInput from "./task-input";
import ClassifyButton from "./classify-button";

export default function SetupForm({ 
  hasDrafts, 
  isLimitReached 
}: { 
  hasDrafts: boolean;
  isLimitReached: boolean;
}) {
  const [isClassifying, setIsClassifying] = useState(false);

  return (
    <>
      <div className="mt-4">
        <TaskInput disabled={isClassifying || isLimitReached} />
      </div>

      <div className="mt-6">
        <ClassifyButton
          disabled={!hasDrafts}
          onPendingChange={setIsClassifying}
        />
      </div>
    </>
  );
}
