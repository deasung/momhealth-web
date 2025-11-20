// next.config.js (수정된 코드)
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // arm64 플랫폼 호환성을 위해 비활성화
  output: "standalone", // <- Docker 런타임에 필요한 standalone 산출물 생성
  poweredByHeader: false, // (옵션) 보안 헤더 숨김
  compress: true, // (옵션) 응답 압축
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ⭐️⭐️⭐️ ALB (리버스 프록시) 환경에서 HTTPS/Host 인식을 위한 핵심 설정 ⭐️⭐️⭐️
  // Next.js 14에서는 experimental.trustHostHeader 옵션이 제거되었습니다.
  // 대신 X-Forwarded-* 헤더는 기본적으로 신뢰됩니다.

  // 외부 이미지 도메인 설정
  images: {
    domains: [
      //https://d2n4p0bysgra0c.cloudfront.net
      "d2n4p0bysgra0c.cloudfront.net", // CloudFront 도메인
    ],
  },

  // 런타임 환경 변수 노출 (서버 사이드에서만 접근 가능)
  // Next.js standalone 모드에서 런타임 환경 변수를 읽기 위해 필요
  // env 설정은 빌드 타임에만 작동하지만, 서버 사이드 코드에서는 런타임에 process.env를 직접 읽을 수 있음
  // 이 설정은 빌드 시점에 환경 변수 이름을 번들에 포함시켜 런타임에 읽을 수 있도록 함
  env: {
    MOMHEALTH_API_URL: process.env.MOMHEALTH_API_URL,
    MOMHEALTH_API_KEY: process.env.MOMHEALTH_API_KEY,
  },

  // 클라이언트 사이드 하이드레이션 문제 방지
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
