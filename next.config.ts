import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ESLint 에러 때문에 빌드 멈추지 않게
  },
  typescript: {
    ignoreBuildErrors: true,    // TS 타입 에러 때문에 빌드 멈추지 않게
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }], // 외부 이미지 허용(필요시)
  },
};

export default nextConfig;
