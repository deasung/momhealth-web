// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // 1. 필수: 사이트 URL 설정 (도메인)
  siteUrl: process.env.NEXTAUTH_URL || "https://medigen.ai.kr",

  // 2. 필수: robots.txt 자동 생성 여부
  generateRobotsTxt: true,

  // 3. (선택) robots.txt 설정
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/", // 모든 크롤러에게 모든 페이지 허용
        // disallow: ['/private/', '/admin/'],
      },
    ],
    // Sitemap 파일의 위치를 지정 (URL 경로)
    sitemap: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/sitemap.xml`
      : "https://medigen.ai.kr/sitemap.xml", // 💡 통일된 폴백 도메인 사용
  },

  // 4. 필수: 출력 디렉토리 설정 (Standalone Docker 최적화)
  outDir: "./.next/static",

  // 5. (선택) Sitemap 파일 분할 설정
  sitemapSize: 50000,

  // 6. (선택) 제외할 경로 설정 (인증 필요 페이지 및 개인화 페이지)
  exclude: [
    "/server-sitemap.xml",
    "/404",
    "/500",
    "/api/*",
    "/login",
    "/signup",
    "/forgot-password",
    "/my/*",
    "/friends/*",
    "/health-questions/*/quiz",
    "/health-questions/*/result",
    "/health-questions/user-completed",
    "/community/my-posts",
  ],
};
