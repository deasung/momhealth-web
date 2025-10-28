import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CommunityWriteModal from "../../components/CommunityWriteModal";
import {
  getMyCommunityPosts,
  deleteCommunityPost,
  updateCommunityPost,
} from "../../lib/api";
import type { CommunityPost } from "../../types/community";
import { useTokenSync } from "../../lib/hooks/useTokenSync";
import { useAuth } from "../../lib/hooks/useAuth";

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
      <div className="min-h-screen bg-white">
        <Head>
          <title>내가 쓴 글 | 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-4">
              내가 쓴 글을 보려면 로그인해주세요.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
      <div className="min-h-screen bg-white">
        <Head>
          <title>내가 쓴 글 | 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">게시글을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>내가 쓴 글 | 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
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
        <title>내가 쓴 글 | 오늘의 건강</title>
        <meta name="description" content="내가 작성한 커뮤니티 게시글 목록" />
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
          뒤로가기
        </button>

        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내가 쓴 글</h1>
          <p className="text-gray-600">
            작성하신 게시글을 확인하고 관리하세요.
          </p>
        </div>

        {/* 게시글 목록 */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePostPress(post.id)}
              >
                <div className="p-6">
                  {/* 작성자 정보 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                      {post.author?.userThumbnailUrl ? (
                        <Image
                          src={post.author.userThumbnailUrl}
                          alt={post.author.nickname || "익명"}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-medium">
                          {(post.author?.nickname || "익명").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {post.author?.nickname || "익명"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>

                    {/* 수정/삭제 버튼 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPostId(post.id);
                          handleEditPost();
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPostId(post.id);
                          handleDeletePost();
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 게시글 내용 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${getTypeColor(
                          post.type
                        )}`}
                      >
                        {post.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {post.content}
                    </p>
                  </div>

                  {/* 하단 정보 */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
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
                        <span>댓글 {post.commentCount || 0}개</span>
                      </div>
                    </div>
                    <span className="text-xs">
                      {new Date(post.updatedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* 더보기 버튼 */}
            {hasMore && (
              <div className="text-center py-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span>로딩 중...</span>
                    </div>
                  ) : (
                    "더보기"
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              작성한 게시글이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">첫 번째 게시글을 작성해보세요!</p>
            <button
              onClick={() => router.push("/community/list")}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                게시글을 삭제하시겠습니까?
              </h3>
              <p className="text-gray-600 mb-6">
                삭제된 게시글은 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPostId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>삭제 중...</span>
                    </div>
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
