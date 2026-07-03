/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone build => tiny Docker image that ships only what it needs.
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "ucarecdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Broadly allow https images so the admin can paste any product image URL.
      { protocol: "https", hostname: "**" },
    ],
  },

  // Static, non-nonce security headers. The nonce-based CSP is set in middleware.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
