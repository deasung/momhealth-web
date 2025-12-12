"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getHealthQuestions, getHealthQuestionCategories } from "../../lib/api";
import type { QuestionListItemDTO } from "../types/dto";
import type { HealthQuestionDetail } from "../types/health-questions";

interface Category {
  id: string;
  name: string;
  secondaryCategories: Array<{ id: string; name: string }>;
}

interface QuestionListClientProps {
  initialQuestions: QuestionListItemDTO[];
  initialNextCursor: string | null;
  initialSearchParams?: {
    q?: string;
    title?: string;
    description?: string;
    categoryId?: string;
    primaryCategoryId?: string;
    secondaryCategoryId?: string;
  };
  categories?: Category[];
}

export default function QuestionListClient({
  initialQuestions,
  initialNextCursor,
  initialSearchParams,
  categories: initialCategories,
}: QuestionListClientProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);
  const observerTarget = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false); // 중복 로딩 방지

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState(
    initialSearchParams?.q ||
      initialSearchParams?.title ||
      initialSearchParams?.description ||
      ""
  );
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState<
    string | null
  >(initialSearchParams?.primaryCategoryId || null);
  const [selectedSecondaryCategory, setSelectedSecondaryCategory] = useState<
    string | null
  >(initialSearchParams?.secondaryCategoryId || null);
  const [categories, setCategories] = useState<Category[]>(
    initialCategories || []
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(
    !!(selectedPrimaryCategory || selectedSecondaryCategory)
  );

  // 카테고리 목록 가져오기
  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      getHealthQuestionCategories()
        .then((data) => {
          setCategories(data || []);
        })
        .catch(() => {
          // 에러는 조용히 처리
        });
    }
  }, [initialCategories]);

  // 검색 옵션 구성
  const getSearchOptions = useCallback(() => {
    const options: {
      title?: string;
      description?: string;
      categoryId?: string;
      primaryCategoryId?: string;
      secondaryCategoryId?: string;
    } = {};

    // 검색어가 있으면 제목과 내용 모두에 적용
    if (searchQuery.trim()) {
      options.title = searchQuery.trim();
      options.description = searchQuery.trim();
    }
    if (selectedSecondaryCategory) {
      options.secondaryCategoryId = selectedSecondaryCategory;
    } else if (selectedPrimaryCategory) {
      options.primaryCategoryId = selectedPrimaryCategory;
    }

    return options;
  }, [searchQuery, selectedPrimaryCategory, selectedSecondaryCategory]);

  // 검색 실행
  const handleSearch = useCallback(async () => {
    if (isSearching) return;

    setIsSearching(true);
    loadingRef.current = true;

    try {
      const searchOptions = getSearchOptions();
      const data = await getHealthQuestions(10, undefined, searchOptions);

      const newQuestionsDTO: QuestionListItemDTO[] = (
        (data.questions || []) as HealthQuestionDetail[]
      ).map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        thumbnailUrl: q.thumbnailUrl,
        primaryCategory: q.primaryCategory,
        secondaryCategory: q.secondaryCategory,
        questionCount: q.questionCount,
        durationSeconds: q.durationSeconds,
        viewCount: q.viewCount,
      }));

      setQuestions(newQuestionsDTO);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);

      // URL 업데이트
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (searchOptions.primaryCategoryId)
        params.set("primaryCategoryId", searchOptions.primaryCategoryId);
      if (searchOptions.secondaryCategoryId)
        params.set("secondaryCategoryId", searchOptions.secondaryCategoryId);

      const newUrl = params.toString()
        ? `/health-questions/list?${params.toString()}`
        : "/health-questions/list";
      router.push(newUrl);
    } catch (err) {
      // 에러는 조용히 처리
    } finally {
      setIsSearching(false);
      loadingRef.current = false;
    }
  }, [isSearching, getSearchOptions, router, searchQuery]);

  // 검색 초기화
  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    setSelectedPrimaryCategory(null);
    setSelectedSecondaryCategory(null);
    router.push("/health-questions/list");
  }, [router]);

  // 더 많은 데이터 로드 (메모리 최적화: 최대 100개까지만 유지)
  const MAX_ITEMS = 100;
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loadingRef.current) return;

    loadingRef.current = true;
    try {
      setLoadingMore(true);
      const searchOptions = getSearchOptions();
      const data = await getHealthQuestions(10, nextCursor, searchOptions);

      // ✅ RSC Payload 최적화: DTO 패턴 적용 - 필요한 필드만 추출
      const newQuestionsDTO: QuestionListItemDTO[] = (
        (data.questions || []) as HealthQuestionDetail[]
      ).map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        thumbnailUrl: q.thumbnailUrl,
        primaryCategory: q.primaryCategory,
        secondaryCategory: q.secondaryCategory,
        questionCount: q.questionCount,
        durationSeconds: q.durationSeconds,
        viewCount: q.viewCount,
      }));

      setQuestions((prev) => {
        const newQuestions = [...prev, ...newQuestionsDTO];
        // 메모리 최적화: 최대 개수 초과 시 오래된 항목 제거
        if (newQuestions.length > MAX_ITEMS) {
          return newQuestions.slice(-MAX_ITEMS);
        }
        return newQuestions;
      });
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      // 에러는 조용히 처리 (사용자 경험을 위해)
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [nextCursor, loadingMore, getSearchOptions]);

  // Intersection Observer로 무한 스크롤 (메모리 최적화: observer 재생성 최소화)
  useEffect(() => {
    if (!hasMore || loadingMore || !observerTarget.current) {
      // observer 정리
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    const target = observerTarget.current;

    // 기존 observer가 있으면 재사용
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loadingRef.current) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );
    }

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current && target) {
        observerRef.current.unobserve(target);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  // 질문 카드 컴포넌트
  const QuestionCard = ({ question }: { question: QuestionListItemDTO }) => {
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

  // 선택된 1차 카테고리의 2차 카테고리 목록
  const selectedPrimary = categories.find(
    (c) => c.id === selectedPrimaryCategory
  );
  const secondaryCategories = selectedPrimary?.secondaryCategories || [];

  return (
    <>
      {/* 검색 UI - 구글 스타일 */}
      <div className="mb-6 md:mb-8">
        {/* 메인 검색창 */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center">
            {/* 검색 아이콘 */}
            <div className="absolute left-4 text-gray-400 pointer-events-none">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* 검색 입력 */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="건강 질문 검색..."
              className="w-full pl-12 pr-12 py-4 text-base sm:text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm hover:shadow-md transition-all"
            />

            {/* 검색어 지우기 버튼 */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  if (!selectedPrimaryCategory && !selectedSecondaryCategory) {
                    handleResetSearch();
                  }
                }}
                className="absolute right-12 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="검색어 지우기"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* 검색 버튼 */}
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 p-2 text-gray-500 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="검색"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
              ) : (
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* 필터 토글 버튼 */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-1"
            >
              <span>필터</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
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
            {(searchQuery ||
              selectedPrimaryCategory ||
              selectedSecondaryCategory) && (
              <button
                onClick={handleResetSearch}
                className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
              >
                초기화
              </button>
            )}
          </div>

          {/* 카테고리 필터 (접을 수 있음) */}
          {showFilters && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="primary-category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    1차 카테고리
                  </label>
                  <select
                    id="primary-category"
                    value={selectedPrimaryCategory || ""}
                    onChange={(e) => {
                      setSelectedPrimaryCategory(e.target.value || null);
                      setSelectedSecondaryCategory(null);
                      // 카테고리 변경 시 자동 검색
                      setTimeout(() => handleSearch(), 0);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-sm sm:text-base bg-white"
                  >
                    <option value="">전체</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="secondary-category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    2차 카테고리
                  </label>
                  <select
                    id="secondary-category"
                    value={selectedSecondaryCategory || ""}
                    onChange={(e) => {
                      setSelectedSecondaryCategory(e.target.value || null);
                      // 카테고리 변경 시 자동 검색
                      setTimeout(() => handleSearch(), 0);
                    }}
                    disabled={!selectedPrimaryCategory}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-sm sm:text-base bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">전체</option>
                    {secondaryCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 표시 */}
      {(searchQuery ||
        selectedPrimaryCategory ||
        selectedSecondaryCategory) && (
        <div className="mb-4 text-sm text-gray-600">
          검색 결과: {questions.length}개
        </div>
      )}

      <div className="space-y-4 sm:space-y-6 mb-8">
        {questions.length > 0 ? (
          questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))
        ) : (
          <div className="text-center py-12 md:py-16">
            <div
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 mb-6"
              role="img"
              aria-label="검색 결과 없음"
            >
              <span className="text-4xl sm:text-5xl">🔍</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              다른 검색어나 필터를 사용해보세요.
            </p>
            <button
              onClick={handleResetSearch}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] shadow-sm hover:shadow-md"
            >
              검색 초기화
            </button>
          </div>
        )}
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
