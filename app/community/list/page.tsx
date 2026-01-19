import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CommunityListClient from "../../components/CommunityListClient";
import { getCommunityPostsServer } from "../../../lib/api-server";
import type { CommunityPost } from "../../types/community";
import type { CommunityPostCardDTO } from "../../types/dto";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// 동적 렌더링 강제 (headers 사용)
export const dynamic = "force-dynamic";

// ✅ SEO: 동적 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "커뮤니티",
    description:
      "건강에 대한 다양한 이야기와 경험을 공유하는 커뮤니티입니다. 건강 질문과 리뷰를 확인하고 참여해보세요.",
    keywords: "건강 커뮤니티, 건강 질문, 건강 리뷰, 건강 경험 공유",
    openGraph: {
      title: "건강 커뮤니티 - 오늘의 건강",
      description: "건강에 대한 다양한 이야기와 경험을 공유하는 커뮤니티",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: "건강 커뮤니티",
        },
      ],
      url: `${siteUrl}/community/list`,
    },
    twitter: {
      card: "summary_large_image",
      title: "건강 커뮤니티 - 오늘의 건강",
      description: "건강에 대한 다양한 이야기와 경험을 공유하는 커뮤니티",
      images: [`${siteUrl}/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/community/list`,
    },
  };
}

// ✅ Server Component: 서버에서 초기 데이터 가져오기
export default async function CommunityPage() {
  let posts: CommunityPostCardDTO[] = [];
  let nextCursor: string | null = null;
  let error: string | null = null;

  try {
    const { getServerTokens } = await import("../../../lib/api-server");
    const tokens = await getServerTokens();

    const data = await getCommunityPostsServer(
      10,
      undefined,
      tokens.accessToken,
      tokens.refreshToken
    );
    // ✅ RSC Payload 최적화: DTO 패턴 적용 - 필요한 필드만 추출
    posts = (data.posts || []).map((p: CommunityPost) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      type: p.type,
      createdAt: p.createdAt,
      author: p.author,
      commentCount: p.commentCount,
      timeAgo: p.timeAgo,
    }));
    nextCursor = data.nextCursor || null;
  } catch (err: unknown) {
    const axiosError = err as {
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
    };
    console.error("❌ [CommunityPage] 커뮤니티 게시글 로딩 실패:", {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
    });
    error = "커뮤니티 게시글을 불러오는데 실패했습니다.";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ✅ 에러 상태 */}
        {error ? (
          <div className="max-w-md mx-auto text-center py-12 md:py-16">
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8 sm:p-10">
              <div
                className="text-red-500 text-5xl sm:text-6xl mb-4"
                role="img"
                aria-label="경고"
              >
                ⚠️
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                오류가 발생했습니다
              </h1>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
                aria-label="홈으로 이동"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>홈으로</span>
              </Link>
            </div>
          </div>
        ) : (
          <section aria-label="커뮤니티 게시글 목록">
            <CommunityListClient
              initialPosts={posts}
              initialNextCursor={nextCursor}
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
