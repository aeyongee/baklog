import { prisma } from "@/lib/db";

interface EnsureUserParams {
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Ensures a User (and UserPreference) row exists for the given email.
 * Returns the user's id.
 */
export async function ensureUser({ email, name, image }: EnsureUserParams): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: name ?? undefined,
      image: image ?? undefined,
    },
    create: { email, name, image },
    select: { id: true },
  });

  // UserPreference도 항상 존재하도록 보장
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      importanceBias: 0,
      urgencyBias: 0,
      keywordWeights: {},
    },
  });

  return user.id;
}
