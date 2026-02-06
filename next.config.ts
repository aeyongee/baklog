import type { NextConfig } from "next";

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
};

export default nextConfig;
