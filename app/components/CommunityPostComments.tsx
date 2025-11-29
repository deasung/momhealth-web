"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createComment,
  deleteComment,
  updateComment,
  getUserProfile,
  getCommunityPostDetail,
} from "../../lib/api";
import { useAuth } from "../../lib/hooks/useAuth";
import type { CommunityPostDetail } from "../types/community";
import type { UserProfile } from "../types/user";

interface CommunityPostCommentsProps {
  postId: string;
  initialComments: CommunityPostDetail["comments"];
}

export default function CommunityPostComments({
  postId,
  initialComments,
}: CommunityPostCommentsProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // 사용자 정보 가져오기
  useEffect(() => {
    if (isAuthenticated) {
      getUserProfile()
        .then((data) => setCurrentUser(data.user))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      await createComment(postId, commentText.trim());
      setCommentText("");
      // 댓글 목록 다시 가져오기
      const updatedPost = await getCommunityPostDetail(postId);
      setComments(updatedPost.comments || []);
    } catch (err) {
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(postId, commentId);
      // 댓글 목록 다시 가져오기
      const updatedPost = await getCommunityPostDetail(postId);
      setComments(updatedPost.comments || []);
    } catch (err) {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleCommentEditStart = (
    commentId: string,
    currentContent: string
  ) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleCommentEditSubmit = async () => {
    if (!editingCommentText.trim() || !editingCommentId) return;

    try {
      await updateComment(postId, editingCommentId, editingCommentText.trim());
      setEditingCommentId(null);
      setEditingCommentText("");
      // 댓글 목록 다시 가져오기
      const updatedPost = await getCommunityPostDetail(postId);
      setComments(updatedPost.comments || []);
    } catch (err) {
      alert("댓글 수정에 실패했습니다.");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <header className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            댓글{" "}
            <span className="text-gray-600 font-normal">
              {comments.length.toLocaleString()}개
            </span>
          </h2>
        </header>

        {comments.length > 0 ? (
          <ul className="space-y-4 sm:space-y-5" role="list">
            {comments.map((comment) => {
              const isOwnComment =
                currentUser &&
                String(currentUser.id) === String(comment.author.id);

              return (
                <li
                  key={comment.id}
                  className="border-b border-gray-100 pb-4 sm:pb-5 last:border-b-0 last:pb-0"
                >
                  <article className="flex items-start gap-3 sm:gap-4">
                    {/* 작성자 아바타 */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                      {comment.author.userThumbnailUrl ? (
                        <Image
                          src={comment.author.userThumbnailUrl}
                          alt={`${
                            comment.author.nickname || "익명"
                          }의 프로필 이미지`}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                          sizes="(max-width: 640px) 40px, 44px"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 text-sm font-semibold"
                          aria-label={`${
                            comment.author.nickname || "익명"
                          }의 프로필 이니셜`}
                        >
                          {(comment.author.nickname || "익명")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 댓글 헤더 */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">
                            {comment.author.nickname || "익명"}
                          </span>
                          <time
                            dateTime={comment.createdAt}
                            className="text-xs text-gray-500"
                          >
                            {new Date(comment.createdAt).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </time>
                        </div>

                        {isOwnComment && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                handleCommentEditStart(
                                  comment.id,
                                  comment.content
                                )
                              }
                              className="text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors font-medium min-h-[32px]"
                              aria-label="댓글 수정"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleCommentDelete(comment.id)}
                              className="text-xs text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors font-medium min-h-[32px]"
                              aria-label="댓글 삭제"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 댓글 내용 */}
                      {editingCommentId !== comment.id ? (
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) =>
                              setEditingCommentText(e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            rows={3}
                            placeholder="댓글을 수정하세요..."
                            aria-label="댓글 수정 입력"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCommentEditSubmit}
                              className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors font-medium min-h-[36px]"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCommentEditCancel}
                              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium min-h-[36px]"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div
              className="text-gray-400 text-4xl sm:text-5xl mb-3"
              role="img"
              aria-label="댓글 없음"
            >
              💬
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              아직 댓글이 없습니다.
            </p>
          </div>
        )}

        {/* 댓글 작성 폼 */}
        {isAuthenticated ? (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCommentSubmit();
              }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="comment-input" className="sr-only">
                  댓글 작성
                </label>
                <textarea
                  id="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 남겨보세요!"
                  className="w-full p-4 border border-gray-300 rounded-lg text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  rows={4}
                  maxLength={1000}
                  aria-label="댓글 입력"
                />
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm ${
                    commentText.length >= 1000
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {commentText.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className={`px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-colors min-h-[44px] ${
                    commentText.trim() && !isSubmittingComment
                      ? "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmittingComment ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      등록 중...
                    </span>
                  ) : (
                    "등록"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
              aria-label="로그인 페이지로 이동"
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
