import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://medigen.ai.kr";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/forgot-password",
          "/my/",
          "/friends/",
          "/health-questions/*/quiz",
          "/health-questions/*/result",
          "/health-questions/user-completed",
          "/community/my-posts",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
