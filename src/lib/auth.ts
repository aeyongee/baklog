import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { ensureUser } from "@/lib/user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    async signIn({ user, profile }) {
      if (!profile?.email) return;

      await ensureUser({
        email: profile.email,
        name: profile.name ?? user.name,
        image: (profile as Record<string, unknown>).picture as string ?? user.image,
      });
    },
  },
});
