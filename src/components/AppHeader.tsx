import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import UserSettingsButton from "./UserSettingsButton";
import GuideButton from "./GuideButton";
import LogoutButton from "./LogoutButton";

export default async function AppHeader() {
  const session = await auth();

  if (!session?.user) redirect("/");

  // 가이드 완료 여부 확인
  const userId = await ensureUser({
    email: session.user.email!,
    name: session.user.name,
    image: session.user.image,
  });

  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    select: { guideCompleted: true },
  });

  const showGuideTooltip = !preference?.guideCompleted;

  return (
    <header className="border-b dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/today" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Baklog"
            width={32}
            height={32}
            className="h-6 w-auto"
            quality={100}
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          <GuideButton showTooltip={showGuideTooltip} />
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
