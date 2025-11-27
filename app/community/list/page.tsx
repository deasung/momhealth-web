import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CommunityListClient from "../../components/CommunityListClient";
import { getCommunityPostsServer } from "../../../lib/api-server";
import type { CommunityPost } from "../../types/community";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

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
  let posts: CommunityPost[] = [];
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
    posts = data.posts || [];
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
        {/* ✅ SEO & 디자인: 헤더 섹션 (건강 질문 / 친구 화면과 톤 통일) */}
        <section className="mb-8 md:mb-12">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            커뮤니티
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            건강에 대한 다양한 이야기와 경험을 공유해보세요.
          </p>
        </section>

        {/* ✅ 에러 상태 */}
        {error ? (
          <div className="max-w-md mx-auto text-center mb-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
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
