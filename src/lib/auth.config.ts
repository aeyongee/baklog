import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith("/today") ||
        nextUrl.pathname.startsWith("/backlog") ||
        nextUrl.pathname.startsWith("/onboarding");

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (nextUrl.pathname === "/" && isLoggedIn) {
        return Response.redirect(new URL("/today/setup", nextUrl));
      }

      return true;
    },
  },
};
