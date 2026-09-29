/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.kombiklimaburada.com/api";
const apiHostname = new URL(apiUrl).hostname;

const nextConfig = {
  // Production & Coolify için standalone output
  output: "standalone",

  // Çevresel değişkenler (build-time inject)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Next.js Image Optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: apiHostname, pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "5004", pathname: "/**" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=()" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ]
  },

  // React strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;
