import { MetadataRoute } from "next";
import { logger } from "@/lib/logger";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://medigen.ai.kr";

  // 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/health-questions/list`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/community/list`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/my/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/my/terms/service`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/my/terms/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 동적 페이지들을 가져오기 위한 API 호출
  try {
    const apiUrl = process.env.MOMHEALTH_API_URL;
    if (!apiUrl) {
      logger.warn("MOMHEALTH_API_URL이 설정되지 않아 동적 페이지를 포함할 수 없습니다.");
      return staticPages;
    }

    // Health Questions 목록 가져오기
    const healthQuestionsResponse = await fetch(
      `${apiUrl}/private/health.questions?limit=1000`,
      {
        headers: {
          "X-API-Key": process.env.MOMHEALTH_API_KEY || "",
        },
        // Next.js에서 fetch 캐싱 비활성화 (항상 최신 데이터)
        cache: "no-store",
      }
    ).catch(() => null);

    const healthQuestions: MetadataRoute.Sitemap = [];
    if (healthQuestionsResponse?.ok) {
      try {
        const data = await healthQuestionsResponse.json();
        if (data?.questions && Array.isArray(data.questions)) {
          healthQuestions.push(
            ...data.questions.map((question: { id: string; updatedAt?: string }) => ({
              url: `${siteUrl}/health-questions/${question.id}`,
              lastModified: question.updatedAt
                ? new Date(question.updatedAt)
                : new Date(),
              changeFrequency: "weekly" as const,
              priority: 0.8,
            }))
          );
        }
      } catch (err) {
        logger.error("Health questions 파싱 실패:", err);
      }
    }

    // Community Posts 목록 가져오기
    const communityPostsResponse = await fetch(
      `${apiUrl}/private/community?limit=1000`,
      {
        headers: {
          "X-API-Key": process.env.MOMHEALTH_API_KEY || "",
        },
        cache: "no-store",
      }
    ).catch(() => null);

    const communityPosts: MetadataRoute.Sitemap = [];
    if (communityPostsResponse?.ok) {
      try {
        const data = await communityPostsResponse.json();
        if (data?.posts && Array.isArray(data.posts)) {
          communityPosts.push(
            ...data.posts.map((post: { id: string; updatedAt?: string }) => ({
              url: `${siteUrl}/community/${post.id}`,
              lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
              changeFrequency: "weekly" as const,
              priority: 0.7,
            }))
          );
        }
      } catch (err) {
        logger.error("Community posts 파싱 실패:", err);
      }
    }

    return [...staticPages, ...healthQuestions, ...communityPosts];
  } catch (error) {
    logger.error("Sitemap 생성 중 오류:", error);
    // 오류 발생 시 정적 페이지만 반환
    return staticPages;
  }
}

