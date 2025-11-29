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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <header className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="모달 닫기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h2
            id="modal-title"
            className="text-lg sm:text-xl font-bold text-gray-900"
          >
            {mode === "edit" ? "글 수정하기" : "글 작성하기"}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
              canSubmit && !submitting
                ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
            aria-label={mode === "edit" ? "수정 완료" : "작성 완료"}
          >
            {submitting ? (
              <svg
                className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full"
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
            ) : (
              <svg
                className="w-6 h-6"
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
            )}
          </button>
        </header>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            {/* 제목 입력 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="post-title"
                  className="text-sm sm:text-base font-semibold text-gray-700"
                >
                  제목
                </label>
                <span
                  className={`text-xs sm:text-sm ${
                    title.length >= 50 ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {title.length}/50
                </span>
              </div>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                placeholder="제목을 입력해주세요."
                maxLength={50}
                className={`w-full px-4 py-3 border-0 border-b-2 focus:outline-none text-sm sm:text-base transition-colors ${
                  titleProfanity.hasProfanity &&
                  title.length >= PROFANITY_CHECK_MIN_LENGTH
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-200 focus:border-orange-500"
                }`}
                aria-invalid={
                  titleProfanity.hasProfanity &&
                  title.length >= PROFANITY_CHECK_MIN_LENGTH
                }
                aria-describedby={
                  titleProfanity.hasProfanity &&
                  title.length >= PROFANITY_CHECK_MIN_LENGTH
                    ? "title-error"
                    : undefined
                }
              />
            </div>

            {/* 본문 입력 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="post-content"
                  className="block text-sm sm:text-base font-semibold text-gray-700"
                >
                  내용
                </label>
                <span className="text-xs sm:text-sm text-gray-400">
                  {content.length}자
                </span>
              </div>
              <textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력해주세요."
                rows={10}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none resize-none text-sm sm:text-base transition-colors ${
                  contentProfanity.hasProfanity &&
                  content.length >= PROFANITY_CHECK_MIN_LENGTH
                    ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200"
                    : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                }`}
                aria-invalid={
                  contentProfanity.hasProfanity &&
                  content.length >= PROFANITY_CHECK_MIN_LENGTH
                }
                aria-describedby={
                  contentProfanity.hasProfanity &&
                  content.length >= PROFANITY_CHECK_MIN_LENGTH
                    ? "content-error"
                    : undefined
                }
              />
            </div>

            {/* 비속어 경고 메시지 */}
            {hasProfanity &&
              (title.length >= PROFANITY_CHECK_MIN_LENGTH ||
                content.length >= PROFANITY_CHECK_MIN_LENGTH) && (
                <div
                  id={
                    titleProfanity.hasProfanity
                      ? "title-error"
                      : "content-error"
                  }
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  role="alert"
                >
                  <p className="text-center text-yellow-800 text-sm sm:text-base font-medium">
                    ⚠️ 부적절한 표현이 포함되어 있습니다. 다시 작성해주세요.
                  </p>
                </div>
              )}

            {/* 안내 문구 */}
            <div className="bg-gray-50 rounded-lg p-4 text-xs sm:text-sm text-gray-600 space-y-1.5">
              <p className="font-medium">💡 커뮤니티 이용 안내</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  광고, 비난, 도배성 글은 영구적으로 활동이 제한될 수 있습니다.
                </li>
                <li>건강한 커뮤니티 문화를 함께 만들어가요.</li>
                <li>자세한 내용은 커뮤니티 이용규칙을 참고해주세요.</li>
              </ul>
            </div>

            {/* 게시글 유형 선택 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <label className="text-sm sm:text-base font-semibold text-gray-700">
                  게시글 유형 선택
                </label>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPostType("건강질문")}
                  className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base min-h-[44px] flex-1 ${
                    postType === "건강질문"
                      ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                  }`}
                  aria-pressed={postType === "건강질문"}
                >
                  <span>건강질문</span>
                  {postType === "건강질문" && (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
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
                  type="button"
                  onClick={() => setPostType("리뷰")}
                  className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base min-h-[44px] flex-1 ${
                    postType === "리뷰"
                      ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                  }`}
                  aria-pressed={postType === "리뷰"}
                >
                  <span>리뷰</span>
                  {postType === "리뷰" && (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
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
          </form>
        </div>
      </div>
    </div>
  );
}
