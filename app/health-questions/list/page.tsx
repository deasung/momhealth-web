"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getHealthQuestions } from "../../../lib/api";
import type { HealthQuestionDetail } from "../../types/health-questions";
import { useTokenSync } from "../../../lib/hooks/useTokenSync";
import { generatePageMetadata } from "../../../lib/metadata";

export default function HealthQuestionsList() {
  const [questions, setQuestions] = useState<HealthQuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const { isTokenSynced } = useTokenSync();
  const observerTarget = useRef<HTMLDivElement>(null); // ✅ UX: 무한 스크롤용

  // ✅ 성능: 초기 데이터 로드 메모이제이션
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getHealthQuestions(10);
      setQuestions(data.questions);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      console.error("질문목록 로딩 실패:", err);
      setError("질문목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (!isTokenSynced) return;
    fetchQuestions();
  }, [isTokenSynced, fetchQuestions]);

  // ✅ 성능: 더 많은 데이터 로드 메모이제이션
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
      setError("추가 질문목록을 불러오는데 실패했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  // ✅ UX: Intersection Observer로 무한 스크롤
  useEffect(() => {
    if (!hasMore || loadingMore || !observerTarget.current) return;

    const target = observerTarget.current; // ✅ ref를 변수로 복사
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

  // ✅ UX & 디자인: 질문 카드 컴포넌트 개선
  const QuestionCard = ({ question }: { question: HealthQuestionDetail }) => {
    const [imageError, setImageError] = useState(false);
    const hasThumbnail = question.thumbnailUrl && !imageError;

    return (
      <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all duration-200">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* ✅ 반응형: 썸네일 섹션 */}
            <div className="w-full sm:w-20 sm:h-20 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 relative">
              {hasThumbnail ? (
                <Image
                  src={question.thumbnailUrl}
                  alt={`${question.title} 썸네일`}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 640px) 100vw, 80px"
                  unoptimized // CloudFront 이미지인 경우
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl sm:text-2xl">💊</span>
                </div>
              )}
            </div>

            {/* ✅ 디자인: 질문 정보 섹션 개선 */}
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <h3 className="font-semibold text-gray-900 text-lg sm:text-xl mb-2 line-clamp-2 leading-snug">
                {question.title}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2 leading-relaxed">
                {question.description}
              </p>

              {/* ✅ 디자인: 카테고리 태그 개선 */}
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

              {/* ✅ 디자인: 메타 정보 개선 */}
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

            {/* ✅ 반응형: 시작 버튼 개선 */}
            <div className="w-full sm:w-auto flex-shrink-0 mt-4 sm:mt-0">
              <Link
                href={`/health-questions/${question.id}`}
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                시작하기
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

  // ✅ UX: 스켈레톤 UI 컴포넌트
  const SkeletonCard = () => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg bg-gray-200"></div>
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  // ✅ 성능: 메타데이터 메모이제이션
  const metadata = useMemo(() => {
    return generatePageMetadata("health-questions", {
      title:
        questions.length > 0
          ? `건강 질문 - ${questions.length}개의 질문이 있습니다`
          : undefined,
      description:
        questions.length > 0
          ? `${questions.length}개의 건강 질문을 통해 나의 건강 상태를 확인해보세요.`
          : undefined,
    });
  }, [questions.length]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="건강 질문"
          description="다양한 건강 질문을 통해 나의 건강 상태를 확인해보세요."
          keywords="건강 질문, 건강 체크, 건강 상태 확인"
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* ✅ UX: 스켈레톤 UI */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="질문 오류"
          description="질문목록을 불러오는 중 오류가 발생했습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-md mx-auto text-center">
            {/* ✅ UX: 에러 상태 개선 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-6">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  새로고침
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    fetchQuestions();
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={metadata.title}
        description={metadata.description}
        keywords={metadata.keywords}
        ogTitle={metadata.ogTitle}
        ogDescription={metadata.ogDescription}
        ogUrl={`${siteUrl}/health-questions/list`}
        canonical={`${siteUrl}/health-questions/list`}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ✅ SEO & 디자인: 헤더 섹션 개선 */}
        <section className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            건강 질문
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요.
          </p>
        </section>

        {/* ✅ SEO: 질문 목록 섹션 */}
        {questions.length > 0 && (
          <section aria-label="건강 질문 목록">
            <div className="space-y-4 sm:space-y-6 mb-8">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>

            {/* ✅ UX: 무한 스크롤 감지 영역 */}
            {hasMore && (
              <div ref={observerTarget} className="py-4">
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-200 border-t-orange-500"></div>
                      <span className="text-sm">
                        더 많은 질문을 불러오는 중...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ✅ UX: 더보기 버튼 (선택적 - 무한 스크롤과 함께 제공) */}
            {hasMore && !loadingMore && (
              <div className="text-center py-4">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-orange-300 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  더 많은 질문 보기
                </button>
              </div>
            )}

            {/* ✅ UX: 더 이상 질문이 없을 때 */}
            {!hasMore && questions.length > 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <svg
                    className="w-5 h-5"
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
                  <p className="text-sm">모든 질문을 확인했습니다.</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ✅ UX: 빈 상태 개선 */}
        {questions.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              질문이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">아직 등록된 질문이 없습니다.</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              홈으로 돌아가기
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
