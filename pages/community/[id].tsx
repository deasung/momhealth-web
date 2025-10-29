import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import CommunityWriteModal from "../../components/CommunityWriteModal";
import {
  getCommunityPostDetail,
  updateCommunityPost,
  deleteCommunityPost,
  getUserProfile,
  createComment,
  deleteComment,
  updateComment,
} from "../../lib/api";
import type { CommunityPostDetail } from "../../types/community";
import { useTokenSync } from "../../lib/hooks/useTokenSync";
import { useAuth } from "../../lib/hooks/useAuth";
import type { UserProfile } from "../../types/user";
import { generateCommunityPostMetadata } from "../../lib/metadata";

const CommunityPostDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isTokenSynced } = useTokenSync();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 댓글 관련 상태
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

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

  const fetchCurrentUser = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const userData = await getUserProfile();
      setCurrentUser(userData.user);
    } catch (err) {
      // 사용자 정보 조회 실패 시 무시
    }
  }, [isAuthenticated]);

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handleDeletePost = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    try {
      setSubmitting(true);
      await deleteCommunityPost(id as string);
      alert("게시글이 삭제되었습니다.");
      router.push("/community/list");
    } catch (err) {
      alert("게시글 삭제에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePost = async (data: {
    title: string;
    content: string;
    type: "건강질문" | "리뷰";
  }) => {
    try {
      setSubmitting(true);
      await updateCommunityPost(id as string, data);
      alert("게시글이 수정되었습니다.");
      setShowEditModal(false);
      // 게시글 정보 새로고침
      await fetchPostDetail();
    } catch (err) {
      alert("게시글 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 등록
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !post) return;

    try {
      setIsSubmittingComment(true);
      await createComment(id as string, commentText.trim());
      setCommentText("");
      // 게시글 정보 새로고침
      await fetchPostDetail();
    } catch (err) {
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(id as string, commentId);
      alert("댓글이 삭제되었습니다.");
      // 게시글 정보 새로고침
      await fetchPostDetail();
    } catch (err) {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  // 댓글 수정 시작
  const handleCommentEditStart = (
    commentId: string,
    currentContent: string
  ) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  // 댓글 수정 취소
  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  // 댓글 수정 완료
  const handleCommentEditSubmit = async () => {
    if (!editingCommentText.trim() || !editingCommentId) return;

    try {
      await updateComment(
        id as string,
        editingCommentId,
        editingCommentText.trim()
      );
      alert("댓글이 수정되었습니다.");
      setEditingCommentId(null);
      setEditingCommentText("");
      // 게시글 정보 새로고침
      await fetchPostDetail();
    } catch (err) {
      alert("댓글 수정에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (!isTokenSynced) return;
    if (id) {
      fetchPostDetail();
      fetchCurrentUser();
    }
  }, [id, isTokenSynced, fetchPostDetail, fetchCurrentUser]);

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

  // 본인 글인지 확인 (타입 변환하여 비교)
  const isOwnPost =
    currentUser && post && String(currentUser.id) === String(post.author.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="커뮤니티 게시글"
          description="커뮤니티 게시글을 불러오는 중입니다."
        />
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
        <SEO
          title="게시글 오류"
          description="게시글을 불러올 수 없습니다."
          noindex={true}
        />
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

  // 동적 메타데이터 생성
  const metadata = generateCommunityPostMetadata(post);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={metadata.title}
        description={metadata.description}
        keywords={metadata.keywords}
        ogTitle={metadata.ogTitle}
        ogDescription={metadata.ogDescription}
        ogUrl={metadata.ogUrl}
      />

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
                    <Image
                      src={post.author.userThumbnailUrl}
                      alt={post.author.nickname}
                      width={64}
                      height={64}
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

              {/* 본인 글인 경우 수정/삭제 버튼 */}
              {isOwnPost && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditPost}
                    disabled={submitting}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDeletePost}
                    disabled={submitting}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              )}
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

        {/* 댓글 섹션 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              댓글 {post.comments.length}개
            </h3>

            {post.comments.length > 0 ? (
              <div className="space-y-4">
                {post.comments.map((comment) => {
                  const isOwnComment =
                    currentUser &&
                    String(currentUser.id) === String(comment.author.id);

                  return (
                    <div
                      key={comment.id}
                      className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        {/* 댓글 작성자 아바타 */}
                        <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                          {comment.author.userThumbnailUrl ? (
                            <Image
                              src={comment.author.userThumbnailUrl}
                              alt={comment.author.nickname || "익명"}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-medium">
                              {(comment.author.nickname || "익명").charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {comment.author.nickname || "익명"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString(
                                  "ko-KR"
                                )}
                              </span>
                            </div>

                            {/* 본인 댓글인 경우 수정/삭제 버튼 */}
                            {isOwnComment && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleCommentEditStart(
                                      comment.id,
                                      comment.content
                                    )
                                  }
                                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() =>
                                    handleCommentDelete(comment.id)
                                  }
                                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 댓글 내용 (수정 모드가 아닌 경우) */}
                          {editingCommentId !== comment.id ? (
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {comment.content}
                            </p>
                          ) : (
                            /* 댓글 수정 모드 */
                            <div className="space-y-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) =>
                                  setEditingCommentText(e.target.value)
                                }
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                rows={3}
                                placeholder="댓글을 수정하세요..."
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleCommentEditSubmit}
                                  className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleCommentEditCancel}
                                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">아직 댓글이 없습니다.</p>
              </div>
            )}

            {/* 댓글 입력 영역 */}
            {isAuthenticated ? (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 남겨보세요!"
                    className="w-full p-4 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {commentText.length}/1000
                    </span>
                    <button
                      onClick={handleCommentSubmit}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        commentText.trim() && !isSubmittingComment
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isSubmittingComment ? "등록 중..." : "등록"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-500 mb-4">
                  댓글을 작성하려면 로그인이 필요합니다.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  로그인하기
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* 수정 모달 */}
      {showEditModal && post && (
        <CommunityWriteModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdatePost}
          initialData={{
            title: post.title,
            content: post.content,
            type: post.type as "건강질문" | "리뷰",
          }}
          mode="edit"
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default CommunityPostDetailPage;
