/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone", // <- Docker 런타임에 필요한 standalone 산출물 생성
  poweredByHeader: false, // (옵션) 보안 헤더 숨김
  compress: true, // (옵션) 응답 압축
  eslint: {
    // ESLint 비활성화
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript 타입 체크를 빌드 시 건너뛰기
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
