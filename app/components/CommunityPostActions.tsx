"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateCommunityPost, deleteCommunityPost } from "../../lib/api";
import type { CommunityPostDetail } from "../types/community";
import CommunityWriteModal from "./CommunityWriteModal";

interface CommunityPostActionsProps {
  post: CommunityPostDetail;
  currentUserId: string | number | null;
}

export default function CommunityPostActions({
  post,
  currentUserId,
}: CommunityPostActionsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 실제 DB 사용자 ID 사용 (user_id 우선, 없으면 기존 id 사용)
  const userId =
    (session?.user as { user_id?: string })?.user_id ||
    currentUserId ||
    session?.user?.id ||
    null;

  // authorId 또는 author.id와 비교
  const authorId = post.authorId || post.author?.id;

  // 숫자로 강제 형변환하여 비교
  const userIdNum = userId ? Number(userId) : null;
  const authorIdNum = authorId ? Number(authorId) : null;

  // // 상세 디버깅
  // console.log("🔍 [CommunityPostActions] 디버깅 정보:", {
  //   "currentUserId (서버에서 전달)": currentUserId,
  //   "session 존재 여부": !!session,
  //   "session?.user": session?.user,
  //   "session?.user?.id": session?.user?.id,
  //   "최종 userId": userId,
  //   "post.id": post.id,
  //   "post.authorId": post.authorId,
  //   "post.author": post.author,
  //   "post.author?.id": post.author?.id,
  //   "최종 authorId": authorId,
  //   "userId 타입": typeof userId,
  //   "authorId 타입": typeof authorId,
  //   "String(userId)": String(userId),
  //   "String(authorId)": String(authorId),
  //   "Number(userId)": Number(userId),
  //   "Number(authorId)": Number(authorId),
  //   "문자열 비교": String(userId) === String(authorId),
  //   "숫자 비교": Number(userId) === Number(authorId),
  //   "userId 존재": !!userId,
  //   "authorId 존재": !!authorId,
  // });

  // 숫자로 강제 형변환하여 비교
  const isOwnPost =
    userIdNum !== null &&
    authorIdNum !== null &&
    !isNaN(userIdNum) &&
    !isNaN(authorIdNum) &&
    userIdNum === authorIdNum;

  console.log("✅ [CommunityPostActions] isOwnPost 최종 결과:", isOwnPost);
  console.log(
    "✅ [CommunityPostActions] 버튼 표시 여부:",
    isOwnPost ? "표시됨" : "표시 안됨"
  );

  if (!isOwnPost) return null;

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handleDeletePost = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    try {
      setSubmitting(true);
      await deleteCommunityPost(post.id);
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
      await updateCommunityPost(post.id, data);
      alert("게시글이 수정되었습니다.");
      setShowEditModal(false);
      // App Router: 서버 컴포넌트 데이터 새로고침
      router.refresh();
    } catch (err) {
      alert("게시글 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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

      {showEditModal && (
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
    </>
  );
}
