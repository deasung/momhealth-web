import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getCommunityPostDetail } from "../../lib/api";
import type { CommunityPostDetail } from "../../types/community";
import { useTokenSync } from "../../lib/hooks/useTokenSync";

const CommunityPostDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isTokenSynced } = useTokenSync();
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPostDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCommunityPostDetail(id as string);
      setPost(data);
    } catch (err) {
      setError("게시글 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isTokenSynced) return;
    if (id) {
      fetchPostDetail();
    }
  }, [id, isTokenSynced, fetchPostDetail]);

  // 게시글 타입별 색상 반환
  const getTypeColor = (type: string) => {
    switch (type) {
      case "리뷰":
        return "bg-green-50 text-green-700";
      case "건강질문":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>커뮤니티 | 오늘의 건강</title>
          <meta name="description" content="커뮤니티 게시글 상세" />
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">게시글을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>커뮤니티 | 오늘의 건강</title>
        </Head>
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
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              뒤로가기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{post.title} | 오늘의 건강</title>
        <meta name="description" content={post.content} />
      </Head>

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
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
        </button>

        {/* 게시글 카드 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* 작성자 아바타 */}
                <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                  {post.author.userThumbnailUrl ? (
                    <img
                      src={post.author.userThumbnailUrl}
                      alt={post.author.nickname}
                      className="w-full h-full object-cover"
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {post.title}
                  </h2>
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
                <span>조회수</span>
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

        {/* 댓글 섹션 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              댓글 {post.comments.length}개
            </h3>

            {post.comments.length > 0 ? (
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      {/* 댓글 작성자 아바타 */}
                      <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                        {comment.author.userThumbnailUrl ? (
                          <img
                            src={comment.author.userThumbnailUrl}
                            alt={comment.author.nickname || "익명"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-medium">
                            {(comment.author.nickname || "익명").charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {comment.author.nickname || "익명"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">아직 댓글이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityPostDetailPage;
