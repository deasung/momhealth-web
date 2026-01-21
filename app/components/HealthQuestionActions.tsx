"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetQuizProgress, getHealthQuestionDetail } from "../../lib/api";
import { useAuth } from "../../lib/hooks/useAuth";
import KakaoShareButton from "./KakaoShareButton";
import { logger } from "@/lib/logger";

interface HealthQuestionActionsProps {
  questionId: string;
  isCompleted: boolean;
  title?: string;
  description?: string;
  imageUrl?: string;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

function ShareButtons({
  questionId,
  title,
  description,
  imageUrl,
}: {
  questionId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    (typeof window !== "undefined" ? window.location.origin : "") +
    `/health-questions/${questionId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert("링크 복사에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleKakaoShareError = () => {
    // 카카오톡 공유 실패 시 링크 복사로 대체
    handleCopyLink();
  };

  // 질문 정보가 있으면 사용, 없으면 기본값 사용
  const shareTitle = title || "오늘의 건강 질문";
  const shareDescription =
    description || "건강 질문을 카카오톡으로 공유해보세요.";
  const shareImageUrl = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${siteUrl}${imageUrl}`
    : `${siteUrl}/og-image.png`;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-4">
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center justify-center gap-2 font-semibold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg bg-white text-gray-800 border border-gray-200 min-h-[44px] sm:min-h-[52px] w-full sm:w-64"
        aria-label="질문 링크 복사"
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
            d="M8 17l4 4 4-4m-4-5v9M4 9V5a2 2 0 012-2h12a2 2 0 012 2v4"
          />
        </svg>
        <span>{copied ? "링크 복사됨" : "링크 복사"}</span>
      </button>
      <KakaoShareButton
        title={shareTitle}
        description={shareDescription}
        imageUrl={shareImageUrl}
        shareUrl={shareUrl}
        onError={handleKakaoShareError}
        className="w-full sm:w-64"
      />
    </div>
  );
}

export default function HealthQuestionActions({
  questionId,
  isCompleted,
  title,
  description,
  imageUrl,
}: HealthQuestionActionsProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [shareData, setShareData] = useState<{
    title?: string;
    description?: string;
    imageUrl?: string;
  }>({
    title,
    description,
    imageUrl,
  });

  // 비로그인 상태에서 질문 정보가 없으면 클라이언트에서 가져오기
  useEffect(() => {
    if (!title && !description && questionId) {
      const fetchQuestionData = async () => {
        try {
          const question = await getHealthQuestionDetail(questionId);
          setShareData({
            title: question.title,
            description: question.description || question.title,
            imageUrl: question.detailThumbnailUrl || question.thumbnailUrl,
          });
        } catch (error) {
          logger.error("질문 정보 가져오기 실패:", error);
          // 에러 발생 시 기본값 유지
        }
      };
      fetchQuestionData();
    }
  }, [questionId, title, description]);

  const handleStartQuestion = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push(`/health-questions/${questionId}/quiz`);
  };

  const handleResetQuestion = async () => {
    if (!isAuthenticated) return;

    try {
      setResetting(true);
      await resetQuizProgress(questionId);
      router.push(`/health-questions/${questionId}/quiz`);
    } catch (error) {
      alert("퀴즈 리셋에 실패했습니다.");
    } finally {
      setResetting(false);
    }
  };

  if (isAuthenticated && isCompleted) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={handleResetQuestion}
            disabled={resetting}
            className="inline-flex items-center justify-center gap-2 font-semibold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] sm:min-h-[52px] w-full sm:w-64"
            aria-label="퀴즈 다시 풀기"
          >
            {resetting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                <span>리셋 중...</span>
              </>
            ) : (
              <>
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>다시 풀기</span>
              </>
            )}
          </button>
          <button
            onClick={() =>
              router.push(`/health-questions/${questionId}/result`)
            }
            className="inline-flex items-center justify-center gap-2 font-semibold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white min-h-[44px] sm:min-h-[52px] w-full sm:w-64"
            aria-label="퀴즈 결과 보기"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>결과 보기</span>
          </button>
        </div>
        <ShareButtons
          questionId={questionId}
          title={title}
          description={description}
          imageUrl={imageUrl}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleStartQuestion}
        className={`inline-flex items-center justify-center gap-2 font-semibold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm min-h-[44px] sm:min-h-[52px] w-full sm:w-64 ${
          isAuthenticated
            ? "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white"
            : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
        }`}
        aria-label={isAuthenticated ? "질문 시작하기" : "로그인 후 시작하기"}
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
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{isAuthenticated ? "질문 시작하기" : "로그인 후 시작하기"}</span>
      </button>
      <ShareButtons
        questionId={questionId}
        title={shareData.title}
        description={shareData.description}
        imageUrl={shareData.imageUrl}
      />
    </div>
  );
}
