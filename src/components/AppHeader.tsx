import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import UserSettingsButton from "./UserSettingsButton";
import GuideButton from "./GuideButton";
import LogoutButton from "./LogoutButton";

export default async function AppHeader() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return (
    <header className="border-b dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/today" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Baklog"
            width={33}
            height={33}
            className="h-8 w-8"
          />
        </Link>
        <div className="flex items-center gap-3">
          <GuideButton />
          <UserSettingsButton
            name={session.user.name ?? ""}
            email={session.user.email ?? ""}
            image={session.user.image ?? undefined}
          />
          <LogoutButton />
        </div>
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
        </div>
      </nav>
    </header>
  );
}
