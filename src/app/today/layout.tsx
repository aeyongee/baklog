import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 미들웨어에서 1차 보호하지만, 방어적으로 한 번 더 체크
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">{session.user.name}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그아웃
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
