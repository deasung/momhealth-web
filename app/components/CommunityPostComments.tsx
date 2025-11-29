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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 sm:p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          댓글 {comments.length}개
        </h3>

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isOwnComment =
                currentUser &&
                String(currentUser.id) === String(comment.author.id);

              return (
                <div
                  key={comment.id}
                  className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
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
                              onClick={() => handleCommentDelete(comment.id)}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>

                      {editingCommentId !== comment.id ? (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {comment.content}
                        </p>
                      ) : (
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
  );
}
