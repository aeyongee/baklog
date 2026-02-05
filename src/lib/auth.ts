import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith("/today") ||
        nextUrl.pathname.startsWith("/backlog");

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (nextUrl.pathname === "/" && isLoggedIn) {
        return Response.redirect(new URL("/today/setup", nextUrl));
      }

      return true;
    },
  },
  events: {
    async signIn({ user, profile }) {
      if (!profile?.email) return;

      // Edge Runtime에서 실행되지 않도록 동적 import
      const { prisma } = await import("@/lib/db");

      await prisma.user.upsert({
        where: { email: profile.email },
        update: {
          name: profile.name ?? user.name,
          image: profile.picture ?? user.image,
        },
        create: {
          email: profile.email,
          name: profile.name ?? user.name,
          image: profile.picture ?? user.image,
          preference: {
            create: {
              importanceBias: 0,
              urgencyBias: 0,
              keywordWeights: {},
            },
          },
        },
      });
    },
  },
});
