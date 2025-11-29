"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHealthQuestions } from "../../lib/api";
import type { HealthQuestionDetail } from "../types/health-questions";

interface QuestionListClientProps {
  initialQuestions: HealthQuestionDetail[];
  initialNextCursor: string | null;
}

export default function QuestionListClient({
  initialQuestions,
  initialNextCursor,
}: QuestionListClientProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 더 많은 데이터 로드
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const data = await getHealthQuestions(10, nextCursor);

      setQuestions((prev) => [...prev, ...data.questions]);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      console.error("추가 질문목록 로딩 실패:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  // Intersection Observer로 무한 스크롤
  useEffect(() => {
    if (!hasMore || loadingMore || !observerTarget.current) return;

    const target = observerTarget.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  // 질문 카드 컴포넌트
  const QuestionCard = ({ question }: { question: HealthQuestionDetail }) => {
    const [imageError, setImageError] = useState(false);
    const hasThumbnail = question.thumbnailUrl && !imageError;

    return (
      <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all duration-200">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="w-full sm:w-20 sm:h-20 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 relative">
              {hasThumbnail ? (
                <Image
                  src={question.thumbnailUrl}
                  alt={`${question.title} 썸네일`}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 640px) 100vw, 80px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl sm:text-2xl">💊</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <h3 className="font-semibold text-gray-900 text-lg sm:text-xl mb-2 line-clamp-2 leading-snug">
                {question.title}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2 leading-relaxed">
                {question.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {question.primaryCategory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    {question.primaryCategory.name}
                  </span>
                )}
                {question.secondaryCategory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    {question.secondaryCategory.name}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1">
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
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  질문 {question.questionCount}개
                </span>
                {question.durationSeconds && (
                  <span className="flex items-center gap-1">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {question.durationSeconds}초
                  </span>
                )}
                <span className="flex items-center gap-1">
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  조회 {question.viewCount}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto flex-shrink-0 mt-4 sm:mt-0">
              <Link
                href={`/health-questions/${question.id}`}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px]"
                aria-label={`${question.title} 질문 시작하기`}
              >
                <span>시작하기</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
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
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 mb-8">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {loadingMore && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-200 border-t-orange-500"></div>
                <span className="text-sm">더 많은 질문을 불러오는 중...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {hasMore && !loadingMore && (
        <div className="text-center py-6 md:py-8">
          <button
            onClick={loadMore}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 hover:border-orange-300 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] shadow-sm hover:shadow-md"
            aria-label="더 많은 질문 불러오기"
          >
            <span>더 많은 질문 보기</span>
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
          </button>
        </div>
      )}

      {!hasMore && questions.length > 0 && (
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
            <p>모든 질문을 확인했습니다.</p>
          </div>
        </div>
      )}
    </>
  );
}
