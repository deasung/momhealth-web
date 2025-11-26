"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwnPost =
    currentUserId && String(currentUserId) === String(post.author.id);

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
