"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import CommunityWriteModal from "../../components/CommunityWriteModal";
import {
  getMyCommunityPosts,
  deleteCommunityPost,
  updateCommunityPost,
} from "../../../lib/api";
import type { CommunityPost } from "../../types/community";
import { useTokenSync } from "../../../lib/hooks/useTokenSync";
import { useAuth } from "../../../lib/hooks/useAuth";

const MyPostsPage = () => {
  const router = useRouter();
  const { isTokenSynced } = useTokenSync();
  const { isAuthenticated } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 선택된 게시글 ID
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 삭제 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = useCallback(async (isRefresh = false, cursor?: number) => {
    try {
      if (cursor) setIsLoadingMore(true);
      else setLoading(true);
      setError(null);

      const response = await getMyCommunityPosts({
        limit: 10,
        cursor: cursor || undefined,
      });

      const postsArr: CommunityPost[] = Array.isArray(response.posts)
        ? response.posts
        : [];
      const nextCursorVal = response.nextCursor;

      if (isRefresh) setPosts(postsArr);
      else {
        setPosts((prev) => {
          if (cursor && prev.length) {
            const existed = new Set(prev.map((p) => p.id));
            const filtered = postsArr.filter((p) => !existed.has(p.id));
            return [...prev, ...filtered];
          }
          return postsArr;
        });
      }

      setNextCursor(nextCursorVal);
      setHasMore(!!nextCursorVal);
    } catch (err) {
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && nextCursor) {
      fetchPosts(false, nextCursor);
    }
  }, [hasMore, isLoadingMore, nextCursor, fetchPosts]);

  useEffect(() => {
    if (!isTokenSynced) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchPosts();
  }, [isTokenSynced, isAuthenticated, fetchPosts, router]);

  const handlePostPress = (postId: string) => {
    router.push(`/community/${postId}`);
  };

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handleDeletePost = () => {
    setShowDeleteModal(true);
  };

  const handleUpdatePost = async (data: {
    title: string;
    content: string;
    type: "건강질문" | "리뷰";
  }) => {
    if (!selectedPostId) return;

    try {
      setSubmitting(true);
      await updateCommunityPost(selectedPostId, data);
      alert("게시글이 수정되었습니다.");
      setShowEditModal(false);
      setSelectedPostId(null);
      // 게시글 목록 새로고침
      await fetchPosts(true);
    } catch (err) {
      alert("게시글 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPostId) return;

    try {
      setIsDeleting(true);
      await deleteCommunityPost(selectedPostId);

      setPosts((prev) => prev.filter((post) => post.id !== selectedPostId));
      setShowDeleteModal(false);
      setSelectedPostId(null);
      alert("게시글이 삭제되었습니다.");
    } catch (err) {
      alert("게시글 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

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

  // 현재 선택된 게시글 찾기
  const selectedPost = selectedPostId
    ? posts.find((post) => post.id === selectedPostId)
    : null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="내가 쓴 글"
          description="내가 작성한 커뮤니티 게시글을 확인하세요."
          noindex={true}
        />
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <div
              className="text-gray-400 text-5xl sm:text-6xl mb-4"
              role="img"
              aria-label="잠금"
            >
              🔒
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              로그인이 필요합니다
            </h1>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              내가 쓴 글을 보려면 로그인해주세요.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors text-sm sm:text-base font-medium min-h-[44px] shadow-sm hover:shadow-md"
              aria-label="로그인 페이지로 이동"
            >
              로그인하기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="내가 쓴 글"
          description="내가 작성한 커뮤니티 게시글을 불러오는 중입니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"
              viewBox="0 0 24 24"
              aria-label="로딩 중"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">
              게시글을 불러오는 중...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="내가 쓴 글 오류"
          description="게시글을 불러오는 중 오류가 발생했습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <div
              className="text-red-500 text-5xl sm:text-6xl mb-4"
              role="img"
              aria-label="경고"
            >
              ⚠️
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
              aria-label="이전 페이지로 돌아가기"
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
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="내가 쓴 글"
        description="내가 작성한 커뮤니티 게시글 목록을 확인하세요."
        noindex={true}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 뒤로가기 버튼 */}
        <nav aria-label="브레드크럼 네비게이션" className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm md:text-base font-medium min-h-[44px]"
            aria-label="이전 페이지로 돌아가기"
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
            <span>뒤로가기</span>
          </button>
        </nav>

        {/* 페이지 제목 */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            내가 쓴 글
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            작성하신 게시글을 확인하고 관리하세요.
          </p>
        </header>

        {/* 게시글 목록 */}
        {posts.length > 0 ? (
          <ul className="space-y-4 sm:space-y-5" role="list">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
                  <div className="p-5 sm:p-6">
                    {/* 작성자 정보 및 액션 버튼 */}
                    <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100">
                          {post.author?.userThumbnailUrl ? (
                            <Image
                              src={post.author.userThumbnailUrl}
                              alt={`${
                                post.author.nickname || "익명"
                              }의 프로필 이미지`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              sizes="(max-width: 640px) 44px, 48px"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 text-sm sm:text-base font-semibold"
                              aria-label={`${
                                post.author?.nickname || "익명"
                              }의 프로필 이니셜`}
                            >
                              {(post.author?.nickname || "익명")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">
                              {post.author?.nickname || "익명"}
                            </span>
                            <time
                              dateTime={post.createdAt}
                              className="text-xs text-gray-500"
                            >
                              <span suppressHydrationWarning>
                                {new Date(post.createdAt).toLocaleDateString(
                                  "ko-KR"
                                )}
                              </span>
                            </time>
                          </div>
                        </div>
                      </div>

                      {/* 수정/삭제 버튼 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPostId(post.id);
                            handleEditPost();
                          }}
                          className="px-3 py-1.5 text-xs sm:text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium min-h-[36px]"
                          aria-label={`${post.title} 게시글 수정`}
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPostId(post.id);
                            handleDeletePost();
                          }}
                          className="px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors font-medium min-h-[36px]"
                          aria-label={`${post.title} 게시글 삭제`}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 게시글 내용 */}
                    <div
                      className="mb-4 cursor-pointer"
                      onClick={() => handlePostPress(post.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium ${getTypeColor(
                            post.type
                          )}`}
                          aria-label={`게시글 유형: ${post.type}`}
                        >
                          {post.type}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed line-clamp-3">
                        {post.content}
                      </p>
                    </div>

                    {/* 하단 정보 */}
                    <footer className="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-4 border-t border-gray-100">
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
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span>
                            댓글 {(post.commentCount || 0).toLocaleString("ko-KR")}개
                          </span>
                        </span>
                      </div>
                      <time dateTime={post.updatedAt} className="text-xs">
                        수정:{" "}
                        <span suppressHydrationWarning>
                          {new Date(post.updatedAt).toLocaleDateString("ko-KR")}
                        </span>
                      </time>
                    </footer>
                  </div>
                </article>
              </li>
            ))}

            {/* 더보기 버튼 */}
            {hasMore && (
              <li className="text-center py-8 md:py-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-100 hover:border-gray-300 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  aria-label="더 많은 게시글 불러오기"
                >
                  {isLoadingMore ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>로딩 중...</span>
                    </>
                  ) : (
                    <>
                      <span>더보기</span>
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </li>
            )}
          </ul>
        ) : (
          <div className="text-center py-12 md:py-16">
            <div
              className="text-gray-400 text-5xl sm:text-6xl mb-4"
              role="img"
              aria-label="게시글 없음"
            >
              📝
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              작성한 게시글이 없습니다
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              첫 번째 게시글을 작성해보세요!
            </p>
            <button
              onClick={() => router.push("/community/list")}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors text-sm sm:text-base font-medium min-h-[44px] shadow-sm hover:shadow-md"
              aria-label="커뮤니티로 이동"
            >
              커뮤니티로 이동
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* 수정 모달 */}
      {showEditModal && selectedPost && (
        <CommunityWriteModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPostId(null);
          }}
          onSubmit={handleUpdatePost}
          initialData={{
            title: selectedPost.title,
            content: selectedPost.content,
            type: selectedPost.type as "건강질문" | "리뷰",
          }}
          mode="edit"
          submitting={submitting}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div
                className="text-red-500 text-5xl sm:text-6xl mb-4"
                role="img"
                aria-label="경고"
              >
                ⚠️
              </div>
              <h3
                id="delete-modal-title"
                className="text-lg sm:text-xl font-bold text-gray-900 mb-2"
              >
                게시글을 삭제하시겠습니까?
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                삭제된 게시글은 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPostId(null);
                  }}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
                  aria-label="삭제 취소"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium min-h-[44px]"
                  aria-label="게시글 삭제 확인"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>삭제 중...</span>
                    </span>
                  ) : (
                    "삭제"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPostsPage;
