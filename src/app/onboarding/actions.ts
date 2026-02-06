"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { buildCustomPrompt, type SurveyAnswers } from "@/lib/ai/buildCustomPrompt";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import { redirect } from "next/navigation";

export async function submitOnboarding(answers: SurveyAnswers) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const userId = await ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const customPrompt = buildCustomPrompt(answers);

  await prisma.userPreference.update({
    where: { userId },
    data: {
      onboardingCompleted: true,
      surveyAnswers: answers as unknown as InputJsonValue,
      customPrompt,
    },
  });

  redirect("/today/setup");
}
