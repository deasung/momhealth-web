import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CommunityListClient from "../../components/CommunityListClient";
import {
  getCommunityPostsServer,
  getServerToken,
} from "../../../lib/api-server";
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
    const token = await getServerToken();
    const data = await getCommunityPostsServer(10, undefined, token);
    posts = data.posts || [];
    nextCursor = data.nextCursor || null;
  } catch (err) {
    console.error("커뮤니티 게시글 로딩 실패:", err);
    error = "커뮤니티 게시글을 불러오는데 실패했습니다.";
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
        ) : (
          <CommunityListClient
            initialPosts={posts}
            initialNextCursor={nextCursor}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
