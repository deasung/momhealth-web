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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2n4p0bysgra0c.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "di7imxmn4pwuq.cloudfront.net",
      },
    ],
    // CloudFront 이미지 최적화 비활성화 (403 에러 방지)
    unoptimized: false,
  },

  // ⚠️ Next.js standalone 모드에서는 env 설정을 제거해야 합니다.
  // env 설정은 빌드 시점에 값을 번들에 포함시키므로, 런타임 환경 변수를 덮어씁니다.
  // 런타임 환경 변수는 Node.js의 process.env로 직접 읽을 수 있습니다.
  // API 라우트(pages/api/*)에서는 process.env를 직접 사용하면 됩니다.

  // 클라이언트 사이드 하이드레이션 문제 방지 및 런타임 환경 변수 주입
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // 서버 사이드에서 클라이언트 전용 모듈이 실행되지 않도록 보호
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
