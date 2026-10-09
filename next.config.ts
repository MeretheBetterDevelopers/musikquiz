import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Spotify-login kræver 127.0.0.1 i stedet for localhost
  allowedDevOrigins: ["127.0.0.1"],
  // Quizzen har kun forsiden – vis den på alle andre stier også (browseren kan huske en gammel omdirigering til fx /dashboard)
  async rewrites() {
    return [{ source: "/:sti((?!lyd/|_next/|favicon).+)", destination: "/" }];
  },
};

export default nextConfig;
