import type { NextConfig } from "next";

const isTauri = process.env.TAURI_BUILD === "true";

const nextConfig: NextConfig = {
  // 프로덕션 최적화
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // 로깅 최소화 (프로덕션)
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Tauri 전용 설정
  ...(isTauri && {
    output: "standalone", // Node.js 서버 번들
    images: {
      unoptimized: true, // 이미지 최적화 비활성화
    },
  }),
};

export default nextConfig;
