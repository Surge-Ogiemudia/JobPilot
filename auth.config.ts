import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no Node.js-only modules).
 * Used by middleware.ts which runs on the Edge runtime.
 * The full auth config (with MongoDB adapter) is in auth.ts.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Always allow: cron jobs (secured by CRON_SECRET in the handler)
      if (pathname.startsWith("/api/cron/")) return true;
      // Always allow: NextAuth internal routes
      if (pathname.startsWith("/api/auth/")) return true;
      // Always allow: login page (unauthenticated)
      if (pathname === "/login") {
        // Redirect logged-in users away from login
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      // API routes: allow through (each handler checks session itself)
      if (pathname.startsWith("/api/")) return true;
      // All other routes: require login
      if (!isLoggedIn) return false; // NextAuth redirects to signIn page
      return true;
    },
  },
  providers: [], // Actual providers are defined in auth.ts
};
