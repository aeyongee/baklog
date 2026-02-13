"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import ConfirmDialog from "./ConfirmDialog";

export default function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleLogoutConfirm = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/" });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogoutClick}
        disabled={isPending}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-40"
      >
        {isPending ? "로그아웃 중..." : "로그아웃"}
      </button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="로그아웃"
        description="정말 로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={handleLogoutConfirm}
        variant="danger"
      />
    </>
  );
}
