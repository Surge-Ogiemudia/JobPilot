import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Node.js-only packages from being bundled for Edge runtime
  serverExternalPackages: [
    "mongoose",
    "mongodb",
    "@auth/mongodb-adapter",
    "bcryptjs",
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
