import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static image optimization handled by inline SVG covers (no remote images yet).
  images: {
    remotePatterns: [
      // Enable when real lesson/cover images arrive (e.g. S3, Bunny CDN, Cloudflare R2).
      { protocol: "https", hostname: "cdn.shohozskill.com" },
    ],
  },
  // Keep the old /courses|books|exams detail URLs working -> /course|book|exam.
  async redirects() {
    return [
      { source: "/courses/:slug", destination: "/course/:slug", permanent: true },
      { source: "/books/:slug", destination: "/book/:slug", permanent: true },
      { source: "/books/:slug/read", destination: "/book/:slug/read", permanent: true },
      { source: "/exams/:slug", destination: "/exam/:slug", permanent: true },
      { source: "/exams/:slug/take", destination: "/exam/:slug/take", permanent: true },
    ];
  },
};

export default nextConfig;
