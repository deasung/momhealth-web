"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getUserCompletedQuestions } from "../../../lib/api";

interface UserCompletedResult {
  id: string;
  questionId: string;
  score: number;
  completedAt: string;
  question: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    primaryCategory: {
      id: string;
      name: string;
    } | null;
    secondaryCategory: {
      id: string;
      name: string;
    } | null;
  };
  result: {
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    linkUrlName: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const LIMIT = 10;

interface CompletedQuestionCardProps {
  item: UserCompletedResult;
  onPress: () => void;
}

const CompletedQuestionCard = ({
  item,
  onPress,
}: CompletedQuestionCardProps) => {
  const categoryName = item.question.primaryCategory?.name || "생활습관";

  const completedDate = (() => {
    const date = new Date(item.completedAt);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  })();

  return (
    <button
      onClick={onPress}
      className="w-full flex items-start gap-6 p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
    >
      {/* 썸네일 */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
        <Image
          src={item.question.thumbnailUrl || "/placeholder.png"}
          alt={item.question.title}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium mb-2">
          {categoryName}
        </span>

        <h3 className="font-medium text-gray-900 text-base mb-2 line-clamp-2">
          {item.question.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>완료일: {completedDate}</span>
        </div>
      </div>
    </button>
  );
};

export default function UserCompletedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const userId = searchParams?.get("userId");
  const userName = searchParams?.get("userName");

  const [completedQuestions, setCompletedQuestions] = useState<
    UserCompletedResult[]
  >([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const loadData = useCallback(
    async (initialLoad = false) => {
      if (!userId || typeof userId !== "string") return;

      if (loading || (!initialLoad && !pagination?.hasNextPage)) {
        return;
      }

      if (!initialLoad) setLoading(true);
      setError(null);

      try {
        const currentPage = initialLoad
          ? 1
          : (pagination?.currentPage || 1) + 1;

        const response = await getUserCompletedQuestions({
          userId: userId,
          page: currentPage,
          limit: LIMIT,
        });

        if (initialLoad) {
          setCompletedQuestions(response.data?.results || []);
          setPagination(response.data?.pagination || null);
        } else {
          const newResults = response.data?.results || [];
          if (newResults.length > 0) {
            setCompletedQuestions((prev) => [...prev, ...newResults]);
            setPagination(response.data?.pagination || null);
          }
        }
      } catch (e: unknown) {
        let errorMessage = "데이터를 불러오는 중 오류가 발생했습니다.";

        if (e && typeof e === "object" && "response" in e) {
          const apiError = e as { response?: { status?: number } };
          if (apiError.response?.status === 401) {
            errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
          } else if (apiError.response?.status === 404) {
            errorMessage = "사용자를 찾을 수 없습니다.";
          } else if (apiError.response?.status === 403) {
            errorMessage = "접근 권한이 없습니다.";
          }
        }

        setError(errorMessage);
        if (initialLoad) {
          setCompletedQuestions([]);
          setPagination(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
      }
    },
    [loading, pagination, userId]
  );

  useEffect(() => {
    if (userId && isAuthenticated) {
      loadData(true);
    }
  }, [userId, isAuthenticated, loadData]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const isNearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < 300;

      if (
        isNearBottom &&
        !loadingMoreRef.current &&
        !loading &&
        pagination?.hasNextPage
      ) {
        loadingMoreRef.current = true;
        loadData(false);
      }
    },
    [loading, pagination?.hasNextPage, loadData]
  );

  const handleQuestionPress = (questionId: string) => {
    router.push(`/health-questions/${questionId}/result`);
  };

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  if (error && !refreshing) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="건강 질문 내역 오류"
          description="건강 질문 내역을 불러오는 중 오류가 발생했습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = (typeof userName === "string" && userName) || "사용자";

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${displayName}의 건강 질문 내역`}
        description={`${displayName}님이 완료한 건강 질문 내역을 확인하세요.`}
        noindex={true}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <button
            onClick={handleBackPress}
            className="mb-4 text-gray-600 hover:text-gray-900"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {displayName}의 건강 질문 내역
          </h1>
        </div>

        {/* 질문 목록 */}
        <div
          className="space-y-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 300px)" }}
          onScroll={handleScroll}
        >
          {completedQuestions.length === 0 && !loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                질문이 없습니다
              </h3>
              <p className="text-gray-600">완료한 건강 질문이 없습니다.</p>
            </div>
          ) : (
            <>
              {completedQuestions.map((item) => (
                <CompletedQuestionCard
                  key={`completed-${item.id}`}
                  item={item}
                  onPress={() => handleQuestionPress(item.questionId)}
                />
              ))}

              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">로딩 중...</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

