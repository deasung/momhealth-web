import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import CommunityWriteModal from "../../components/CommunityWriteModal";
import { getCommunityPosts, createCommunityPost } from "../../lib/api";
import { useAuth } from "../../lib/hooks/useAuth";
import type { CommunityPost, CommunityResponse } from "../../types/community";
import { useTokenSync } from "../../lib/hooks/useTokenSync";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 글쓰기 모달 상태
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { isTokenSynced } = useTokenSync();
  const { isAuthenticated } = useAuth();

  const handleWritePost = () => {
    setShowWriteModal(true);
  };

  const handleCloseModal = () => {
    setShowWriteModal(false);
  };

  const handleSubmit = async (data: {
    title: string;
    content: string;
    type: "건강질문" | "리뷰";
  }) => {
    try {
      setSubmitting(true);

      await createCommunityPost(data);

      alert("게시글이 등록되었습니다.");
      handleCloseModal();

      // 게시글 목록 새로고침
      const refreshedData: CommunityResponse = await getCommunityPosts(10);
      setPosts(refreshedData.posts);
      setNextCursor(refreshedData.nextCursor);
      setHasMore(!!refreshedData.nextCursor);
    } catch (err: any) {
      let errorMessage = "등록 중 오류가 발생했습니다.";

      const status = err?.response?.status;
      if (status === 401) {
        errorMessage = "로그인이 필요합니다.";
      } else if (status === 400) {
        errorMessage =
          err?.response?.data?.error || "입력 정보를 확인해주세요.";
      } else if (status >= 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (!isTokenSynced) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const data: CommunityResponse = await getCommunityPosts(10);
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        setError("커뮤니티 게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isTokenSynced]);

  // 더 많은 데이터 로드
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const data: CommunityResponse = await getCommunityPosts(10, nextCursor);

      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      setError("추가 커뮤니티 게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoadingMore(false);
    }
  };

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

  // 게시글 카드 컴포넌트
  const PostCard = ({ post }: { post: CommunityPost }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
      <div className="p-4 md:p-6">
        {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* 작성자 정보와 게시글 내용 */}
          <div className="flex items-start gap-3 md:gap-4 flex-1">
            {/* 작성자 아바타 */}
            <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
              {post.author.userThumbnailUrl ? (
                <img
                  src={post.author.userThumbnailUrl}
                  alt={post.author.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs md:text-sm font-medium">
                  {post.author.nickname.charAt(0)}
                </div>
              )}
            </div>

            {/* 게시글 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(
                    post.type
                  )}`}
                >
                  {post.type}
                </span>
                <span className="text-xs text-gray-500">{post.timeAgo}</span>
              </div>

              <h3 className="font-semibold text-gray-900 text-base md:text-lg mb-2 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2 md:line-clamp-3">
                {post.content}
              </p>

              {/* 메타 정보 */}
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs md:text-sm text-gray-500">
                <span>작성자: {post.author.nickname}</span>
                <span className="hidden md:inline">
                  댓글 {post.commentCount}개
                </span>
                <span className="md:hidden">댓글 {post.commentCount}개</span>
                <span>
                  {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </div>

          {/* 더보기 버튼 */}
          <div className="md:ml-4 md:flex-shrink-0">
            <Link
              href={`/community/${post.id}`}
              className="inline-flex items-center justify-center w-full md:w-auto px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              더보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="커뮤니티"
          description="건강에 대한 다양한 이야기와 경험을 공유하는 커뮤니티입니다. 건강 질문과 리뷰를 확인하고 참여해보세요."
          keywords="건강 커뮤니티, 건강 질문, 건강 리뷰, 건강 경험 공유"
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              커뮤니티 게시글을 불러오는 중...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="커뮤니티 오류"
          description="커뮤니티 페이지에서 오류가 발생했습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="커뮤니티"
        description="건강에 대한 다양한 이야기와 경험을 공유하는 커뮤니티입니다. 건강 질문과 리뷰를 확인하고 참여해보세요."
        keywords="건강 커뮤니티, 건강 질문, 건강 리뷰, 건강 경험 공유"
        ogTitle="건강 커뮤니티 - 오늘의 건강"
        ogDescription="건강에 대한 다양한 이야기와 경험을 공유하는 커뮤니티"
        ogUrl={`${
          process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr"
        }/community/list`}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                커뮤니티
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                건강에 대한 다양한 이야기와 경험을 공유해보세요.
              </p>
            </div>
            {/* 로그인 상태일 때만 글쓰기 버튼 표시 */}
            {isAuthenticated && (
              <button
                onClick={handleWritePost}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium ml-4 flex-shrink-0"
              >
                {/* 모바일에서는 아이콘만, 데스크톱에서는 아이콘 + 텍스트 */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden md:inline">글쓰기</span>
              </button>
            )}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="text-center py-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  로딩 중...
                </div>
              ) : (
                "더 많은 게시글 보기"
              )}
            </button>
          </div>
        )}

        {/* 더 이상 게시글이 없을 때 */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">모든 게시글을 확인했습니다.</p>
          </div>
        )}

        {/* 게시글이 없을 때 */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              게시글이 없습니다
            </h3>
            <p className="text-gray-600">아직 등록된 게시글이 없습니다.</p>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <Footer />

      {/* 글쓰기 모달 */}
      <CommunityWriteModal
        isOpen={showWriteModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
