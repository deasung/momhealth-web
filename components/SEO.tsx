import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export default function SEO({
  title = "오늘의 건강",
  description = "건강한 하루를 위한 맞춤형 건강 관리 서비스",
  keywords = "건강, 의료, 질문, 커뮤니티, 건강관리",
  ogTitle,
  ogDescription,
  ogImage = "/og-image.png",
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
  noindex = false,
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";
  const fullTitle = title === "오늘의 건강" ? title : `${title} | 오늘의 건강`;

  return (
    <Head>
      {/* 기본 메타 태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta
        property="og:image"
        content={ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`}
      />
      <meta property="og:url" content={ogUrl || siteUrl} />
      <meta property="og:site_name" content="오늘의 건강" />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content={twitterTitle || ogTitle || fullTitle}
      />
      <meta
        name="twitter:description"
        content={twitterDescription || ogDescription || description}
      />
      <meta
        name="twitter:image"
        content={
          twitterImage || ogImage.startsWith("http")
            ? ogImage
            : `${siteUrl}${ogImage}`
        }
      />

      {/* 추가 메타 태그 */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#ff5b24" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
