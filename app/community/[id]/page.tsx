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
import { formatTimeAgo } from "../../../lib/utils/timeFormat";

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

    // 현재 사용자 ID 가져오기 (실제 DB 사용자 ID 우선)
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = session.user as { user_id?: string; id?: string };
      currentUserId = user.user_id || user.id || null;
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
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center py-12 md:py-16">
            <div
              className="text-red-500 text-5xl md:text-6xl mb-4"
              role="img"
              aria-label="경고"
            >
              ⚠️
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">
              오류가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              {error || "게시글을 찾을 수 없습니다."}
            </p>
            <Link
              href="/community/list"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base font-medium min-h-[44px]"
              aria-label="커뮤니티 목록으로 이동"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              목록으로
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 뒤로가기 버튼 */}
        <nav aria-label="브레드크럼 네비게이션" className="mb-6">
          <Link
            href="/community/list"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm md:text-base font-medium min-h-[44px]"
            aria-label="커뮤니티 목록으로 돌아가기"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>목록으로</span>
          </Link>
        </nav>

        {/* 게시글 카드 */}
        <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
          <header className="p-6 sm:p-8 border-b border-gray-100">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                {/* 작성자 아바타 */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100">
                  {post.author.userThumbnailUrl ? (
                    <Image
                      src={post.author.userThumbnailUrl}
                      alt={`${post.author.nickname}의 프로필 이미지`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      sizes="(max-width: 640px) 48px, (max-width: 768px) 56px, 64px"
                      priority
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 text-lg sm:text-xl font-semibold"
                      aria-label={`${post.author.nickname}의 프로필 이니셜`}
                    >
                      {post.author.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium ${getTypeColor(
                        post.type
                      )}`}
                      aria-label={`게시글 유형: ${post.type}`}
                    >
                      {post.type}
                    </span>
                    <time
                      dateTime={post.createdAt}
                      className="text-xs sm:text-sm text-gray-500"
                    >
                      {formatTimeAgo(post.createdAt)}
                    </time>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight break-words">
                    {post.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="sr-only">작성자</span>
                      <span className="font-medium">
                        {post.author.nickname}
                      </span>
                    </span>
                    <time
                      dateTime={post.createdAt}
                      className="flex items-center gap-1.5"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </time>
                  </div>
                </div>
              </div>

              {/* 본인 글인 경우 수정/삭제 버튼 - Client Component */}
              <div className="flex-shrink-0">
                <CommunityPostActions
                  post={post}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </header>

          {/* 게시글 내용 */}
          <div className="p-6 sm:p-8">
            <div className="prose prose-gray max-w-none">
              <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                {post.content}
              </div>
            </div>
          </div>

          {/* 하단 정보 */}
          <footer className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>조회 {post.viewCount.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>댓글 {post.comments.length.toLocaleString()}개</span>
              </div>
            </div>
          </footer>
        </article>

        {/* 댓글 섹션 - Client Component */}
        <section aria-label="댓글">
          <CommunityPostComments
            postId={post.id}
            initialComments={post.comments}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
