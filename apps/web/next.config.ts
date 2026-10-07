import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  // Keep client-side navigations snappy: reuse the router cache for a short
  // window so back/forward + repeat visits don't re-hit the server.
  experimental: {
    staleTimes: { dynamic: 30, static: 300 },
    optimizePackageImports: ["@tiptap/react", "@tiptap/starter-kit", "hls.js", "pdfjs-dist"],
  },
  // Static image optimization handled by inline SVG covers (no remote images yet).
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      // Enable when real lesson/cover images arrive (e.g. S3, Bunny CDN, Cloudflare R2).
      { protocol: "https", hostname: "cdn.shohozskill.com" },
      { protocol: "https", hostname: "api.shohozskill.com.bd" },
      { protocol: "https", hostname: "shohozskill.com.bd" },
      { protocol: "https", hostname: "www.shohozskill.com.bd" },
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
