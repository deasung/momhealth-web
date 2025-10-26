// next.config.js (수정된 코드)
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
  // Next.js가 X-Forwarded-* 헤더를 신뢰하도록 명시적으로 설정합니다.
  // 이 옵션은 Next.js가 ALB로부터 받은 요청을 'http'가 아닌 'https'로
  // 올바르게 인식하도록 도와줍니다.
  experimental: {
    // ⚠️ 버전별로 옵션 이름이나 동작이 다를 수 있음.
    // Next.js 13/14 환경에서 self-hosting 시 공식 문서를 확인하는 것이 좋음.
    // 하지만 이 옵션을 먼저 시도해 보세요.
    trustHostHeader: true,
  },

  // 외부 이미지 도메인 설정
  images: {
    domains: [
      "di7imxmn4pwuq.cloudfront.net", // CloudFront 도메인
    ],
  },
};

module.exports = nextConfig;
