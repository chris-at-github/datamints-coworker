import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server runs inside the DDEV web container and is reached through
  // the DDEV router. Next.js rejects dev requests carrying a foreign Host
  // header unless that origin is listed here.
  allowedDevOrigins: ["datamints-coworker.ddev.site"],
};

export default nextConfig;
