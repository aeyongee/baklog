"use client";

export default function LoadingButton({
  pending,
  children,
  pendingText,
  ...props
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingText?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={pending || props.disabled}
      {...props}
      className={`w-full rounded-xl bg-[#FF2F92] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#e6287f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 transition-all ${props.className ?? ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {pendingText ?? "처리 중..."}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
