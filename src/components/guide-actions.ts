"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";

export async function markGuideAsCompleted() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      guideCompleted: true,
    },
    update: {
      guideCompleted: true,
    },
  });
}
