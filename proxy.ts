import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Next.js 16 renamed middleware.ts → proxy.ts
 * Uses ONLY the edge-compatible authConfig — no Node.js modules.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
