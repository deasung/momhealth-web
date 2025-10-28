import { useState, useEffect, useMemo } from "react";
import {
  filterProfanity,
  getProfanityWarningMessage,
} from "../utils/profanityFilter";

// 비속어 검사 최소 글자 수
const PROFANITY_CHECK_MIN_LENGTH = 2;

interface CommunityWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    type: "건강질문" | "리뷰";
  }) => void;
  initialData?: {
    title: string;
    content: string;
    type: "건강질문" | "리뷰";
  };
  mode?: "create" | "edit";
  submitting?: boolean;
}

export default function CommunityWriteModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  submitting = false,
}: CommunityWriteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"건강질문" | "리뷰">("건강질문");

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setPostType(initialData.type);
    }
  }, [initialData, isOpen]);

  // 모달 닫을 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setContent("");
      setPostType("건강질문");
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  // 비속어 검사 (최소 글자 수 이상 입력된 후에만)
  const titleProfanity = useMemo(() => {
    if (title.length === 0 || title.length < PROFANITY_CHECK_MIN_LENGTH)
      return { hasProfanity: false, filteredText: title, originalText: title };
    return filterProfanity(title.trim());
  }, [title]);

  const contentProfanity = useMemo(() => {
    if (content.length === 0 || content.length < PROFANITY_CHECK_MIN_LENGTH)
      return {
        hasProfanity: false,
        filteredText: content,
        originalText: content,
      };
    return filterProfanity(content.trim());
  }, [content]);

  const hasProfanity =
    titleProfanity.hasProfanity || contentProfanity.hasProfanity;

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    if (hasProfanity) {
      alert(getProfanityWarningMessage());
      return;
    }
    onSubmit({ title, content, type: postType });
  };

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !hasProfanity;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full h-full md:w-full md:h-full lg:max-w-2xl lg:max-h-[90vh] lg:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "edit" ? "글 수정하기" : "글 작성하기"}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={
              canSubmit && !submitting
                ? "text-orange-500 hover:text-orange-600"
                : "text-gray-400 hover:text-gray-900"
            }
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 제목 입력 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">제목</label>
              <span className="text-sm text-gray-400">{title.length}/50</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
              placeholder="제목을 입력해주세요."
              className={`w-full px-4 py-3 border-0 border-b-2 focus:outline-none text-base ${
                titleProfanity.hasProfanity &&
                title.length >= PROFANITY_CHECK_MIN_LENGTH
                  ? "border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
            />
          </div>

          {/* 본문 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력해주세요."
              rows={10}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none resize-none ${
                contentProfanity.hasProfanity &&
                content.length >= PROFANITY_CHECK_MIN_LENGTH
                  ? "border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
            />
          </div>

          {/* 비속어 경고 메시지 */}
          {hasProfanity &&
            (title.length >= PROFANITY_CHECK_MIN_LENGTH ||
              content.length >= PROFANITY_CHECK_MIN_LENGTH) && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-center text-yellow-700 text-sm">
                  ⚠️ 부적절한 표현이 포함되어 있습니다. 다시 작성해주세요.
                </p>
              </div>
            )}

          {/* 안내 문구 */}
          <div className="mb-6 text-sm text-gray-500 space-y-2">
            <p>
              광고, 비난, 도배성 글을 남기면 영구적으로 활동이 제한될 수 있어요.
            </p>
            <p>건강한 커뮤니티 문화를 함께 만들어가요.</p>
            <p>자세한 내용은 커뮤니티 이용규칙을 참고해주세요.</p>
          </div>

          {/* 게시글 유형 선택 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <label className="text-sm font-medium text-gray-700">
                게시글 유형 선택
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPostType("건강질문")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  postType === "건강질문"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                건강질문
                {postType === "건강질문" && (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setPostType("리뷰")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  postType === "리뷰"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                리뷰
                {postType === "리뷰" && (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
