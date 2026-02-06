import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (session?.user?.email) {
    const userId = await ensureUser({
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
    const pref = await prisma.userPreference.findUnique({
      where: { userId },
      select: { onboardingCompleted: true },
    });
    if (pref?.onboardingCompleted) {
      redirect("/today/setup");
    }
  }

  return (
    <main className="mx-auto max-w-lg">
      <OnboardingForm />
    </main>
  );
}
