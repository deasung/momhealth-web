"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCommunityPosts, createCommunityPost } from "../../lib/api";
import type { CommunityResponse, CommunityPost } from "../types/community";
import type { CommunityPostCardDTO } from "../types/dto";
import CommunityWriteModal from "./CommunityWriteModal";
import { useAuth } from "../../lib/hooks/useAuth";
import { useTokenSync } from "../../lib/hooks/useTokenSync";

interface CommunityListClientProps {
  initialPosts: CommunityPostCardDTO[];
  initialNextCursor: string | null;
}

export default function CommunityListClient({
  initialPosts,
  initialNextCursor,
}: CommunityListClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const loadingRef = useRef(false); // 중복 로딩 방지

  // 메모리 최적화: 최대 100개까지만 유지
  const MAX_ITEMS = 100;

  const { isAuthenticated } = useAuth();
  const { isTokenSynced } = useTokenSync(); // 세션 토큰을 localStorage에 동기화

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
    // 토큰 동기화가 완료되지 않았으면 대기
    if (!isTokenSynced) {
      alert("인증 상태를 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

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
    } catch (err: unknown) {
      let errorMessage = "등록 중 오류가 발생했습니다.";
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { error?: string };
        };
      };
      const status = axiosError?.response?.status;
      if (status === 401) {
        errorMessage = "로그인이 필요합니다.";
      } else if (status === 400) {
        errorMessage =
          axiosError?.response?.data?.error || "입력 정보를 확인해주세요.";
      } else if (status && status >= 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loadingRef.current) return;

    loadingRef.current = true;
    try {
      setLoadingMore(true);
      const data: CommunityResponse = await getCommunityPosts(10, nextCursor);

      // ✅ RSC Payload 최적화: DTO 패턴 적용 - 필요한 필드만 추출
      const newPostsDTO: CommunityPostCardDTO[] = (
        (data.posts || []) as CommunityPost[]
      ).map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        type: p.type,
        createdAt: p.createdAt,
        author: p.author,
        commentCount: p.commentCount,
        timeAgo: p.timeAgo,
      }));

      setPosts((prev) => {
        const newPosts = [...prev, ...newPostsDTO];
        // 메모리 최적화: 최대 개수 초과 시 오래된 항목 제거
        if (newPosts.length > MAX_ITEMS) {
          return newPosts.slice(-MAX_ITEMS);
        }
        return newPosts;
      });
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      // 에러는 조용히 처리 (사용자 경험을 위해)
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [nextCursor, loadingMore]);

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

  const PostCard = ({ post }: { post: CommunityPostCardDTO }) => (
    <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <Link
        href={`/community/${post.id}`}
        className="block p-4 sm:p-5 md:p-6"
        aria-label={`${post.title} 게시글 보기`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            {/* 작성자 아바타 */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100">
              {post.author.userThumbnailUrl ? (
                <Image
                  src={post.author.userThumbnailUrl}
                  alt={`${post.author.nickname}의 프로필 이미지`}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 640px) 44px, (max-width: 768px) 48px, 56px"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 text-sm sm:text-base font-semibold"
                  aria-label={`${post.author.nickname}의 프로필 이니셜`}
                >
                  {post.author.nickname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* 게시글 메타 정보 */}
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
                  className="text-xs text-gray-500"
                >
                  {post.timeAgo}
                </time>
              </div>

              {/* 제목 */}
              <h3 className="font-bold text-gray-900 text-base sm:text-lg md:text-xl mb-2 line-clamp-2 leading-tight">
                {post.title}
              </h3>

              {/* 내용 미리보기 */}
              <p className="text-gray-600 text-sm sm:text-base mb-3 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {post.content}
              </p>

              {/* 하단 정보 */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="sr-only">작성자</span>
                  <span className="font-medium">{post.author.nickname}</span>
                </span>
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
                  <span>댓글 {post.commentCount.toLocaleString()}개</span>
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

          {/* 더보기 버튼 */}
          <div className="sm:ml-4 sm:flex-shrink-0 flex sm:block">
            <span className="inline-flex items-center justify-center w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors min-h-[44px]">
              더보기
              <svg
                className="w-4 h-4 ml-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );

  return (
    <>
      <div className="flex items-start justify-between mb-6 md:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            커뮤니티
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            건강에 대한 다양한 이야기와 경험을 공유해보세요.
          </p>
        </div>
        {isAuthenticated && isTokenSynced && (
          <button
            onClick={handleWritePost}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg transition-colors text-sm sm:text-base font-medium ml-4 flex-shrink-0 min-h-[44px] shadow-sm hover:shadow-md"
            aria-label="새 게시글 작성"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">글쓰기</span>
            <span className="sm:hidden">글쓰기</span>
          </button>
        )}
      </div>

      <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center py-8 md:py-12">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-100 hover:border-gray-300 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            aria-label="더 많은 게시글 불러오기"
          >
            {loadingMore ? (
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
                <span>더 많은 게시글 보기</span>
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
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 md:py-12">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm sm:text-base">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>모든 게시글을 확인했습니다.</span>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div
            className="text-gray-400 text-5xl sm:text-6xl mb-4"
            role="img"
            aria-label="게시글 없음"
          >
            💬
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            게시글이 없습니다
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            아직 등록된 게시글이 없습니다.
          </p>
        </div>
      )}

      <CommunityWriteModal
        isOpen={showWriteModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </>
  );
}
