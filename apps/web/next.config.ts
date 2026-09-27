import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static image optimization handled by inline SVG covers (no remote images yet).
  images: {
    remotePatterns: [
      // Enable when real lesson/cover images arrive (e.g. S3, Bunny CDN, Cloudflare R2).
      { protocol: "https", hostname: "cdn.shohozskill.com" },
    ],
  },
};

export default nextConfig;
