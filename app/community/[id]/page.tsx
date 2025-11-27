import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CommunityPostComments from "../../components/CommunityPostComments";
import CommunityPostActions from "../../components/CommunityPostActions";
import { getCommunityPostDetailServer } from "../../../lib/api-server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import type { CommunityPostDetail } from "../../types/community";
import { generateCommunityPostMetadata } from "../../../lib/metadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const { getServerTokens } = await import("../../../lib/api-server");
    const tokens = await getServerTokens();
    const post = await getCommunityPostDetailServer(
      params.id,
      tokens.accessToken,
      tokens.refreshToken
    );
    const metadata = generateCommunityPostMetadata(post);

    return {
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
      openGraph: {
        title: metadata.ogTitle || metadata.title,
        description: metadata.ogDescription || metadata.description,
        images: [
          {
            url: `${siteUrl}/og-image.png`,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: post.title,
          },
        ],
        url: metadata.ogUrl || `${siteUrl}/community/${post.id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: metadata.ogTitle || metadata.title,
        description: metadata.ogDescription || metadata.description,
        images: [`${siteUrl}/og-image.png`],
      },
      alternates: {
        canonical: metadata.ogUrl || `${siteUrl}/community/${post.id}`,
      },
    };
  } catch (error) {
    return {
      title: "커뮤니티 게시글",
      description: "커뮤니티 게시글을 불러오는 중입니다.",
    };
  }
}

// 게시글 타입별 색상 반환
function getTypeColor(type: string) {
  switch (type) {
    case "리뷰":
      return "bg-green-50 text-green-700";
    case "건강질문":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
}

// ✅ Server Component: 서버에서 데이터 가져오기
export default async function CommunityPostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let post: CommunityPostDetail | null = null;
  let error: string | null = null;
  let currentUserId: string | number | null = null;

  try {
    const { getServerTokens } = await import("../../../lib/api-server");
    const tokens = await getServerTokens();
    post = await getCommunityPostDetailServer(
      params.id,
      tokens.accessToken,
      tokens.refreshToken
    );

    // 현재 사용자 ID 가져오기
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      currentUserId = session.user.id;
    }
  } catch (err: unknown) {
    const axiosError = err as {
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
    };
    console.error("❌ [CommunityPostDetailPage] 게시글 상세 로딩 실패:", {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
    });
    error = "게시글 정보를 불러올 수 없습니다.";
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "게시글을 찾을 수 없습니다."}
            </p>
            <Link
              href="/community/list"
              className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              목록으로
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 댓글 새로고침 함수 (Client Component에서 사용)
  const refreshPost = async () => {
    "use server";
    const { getServerTokens } = await import("../../../lib/api-server");
    const tokens = await getServerTokens();
    const updatedPost = await getCommunityPostDetailServer(
      params.id,
      tokens.accessToken,
      tokens.refreshToken
    );
    return updatedPost;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 뒤로가기 버튼 */}
        <Link
          href="/community/list"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          목록으로
        </Link>

        {/* 게시글 카드 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* 작성자 아바타 */}
                <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                  {post.author.userThumbnailUrl ? (
                    <Image
                      src={post.author.userThumbnailUrl}
                      alt={post.author.nickname}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl font-medium">
                      {post.author.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${getTypeColor(
                        post.type
                      )}`}
                    >
                      {post.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {post.timeAgo}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {post.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>작성자: {post.author.nickname}</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 본인 글인 경우 수정/삭제 버튼 - Client Component */}
              <CommunityPostActions post={post} currentUserId={currentUserId} />
            </div>

            {/* 게시글 내용 */}
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* 하단 정보 */}
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span>조회수 {post.viewCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>댓글 {post.comments.length}개</span>
              </div>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 - Client Component */}
        <CommunityPostComments
          postId={post.id}
          initialComments={post.comments}
        />
      </main>

      <Footer />
    </div>
  );
}
