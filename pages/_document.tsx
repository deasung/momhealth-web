import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";
  const ogImage = `${siteUrl}/og-image.png`;

  return (
    <Html lang="ko">
      <Head>
        {/* 기본 Open Graph 메타 태그 - 서버 사이드에서 항상 렌더링 */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="오늘의 건강" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:url" content={siteUrl} />

        {/* 기본 Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImage} />

        {/* 기본 메타 태그 */}
        <meta
          name="description"
          content="건강한 하루를 위한 맞춤형 건강 관리 서비스"
        />
        <meta name="keywords" content="건강, 의료, 질문, 커뮤니티, 건강관리" />
        <meta name="theme-color" content="#ff5b24" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
