import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="border-b dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">{session.user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              로그아웃
            </button>
          </form>
        </div>
        <nav className="border-t dark:border-gray-700">
          <div className="flex items-center justify-center gap-1 px-4 py-2">
            <Link
              href="/today"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              오늘
            </Link>
            <Link
              href="/today/setup"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              작업 추가
            </Link>
            <Link
              href="/backlog"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Backlog
            </Link>
            <Link
              href="/monthly"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Monthly
            </Link>
            <Link
              href="/archive"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              아카이브
            </Link>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
