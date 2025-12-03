import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import {
  getServerToken,
  getUserCompletedQuestionsServer,
} from "../../../lib/api-server";

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

interface UserCompletedResponse {
  data: {
    results: UserCompletedResult[];
    pagination: PaginationInfo;
  };
}

const LIMIT = 10;

interface CompletedQuestionCardProps {
  item: UserCompletedResult;
}

const CompletedQuestionCard = ({ item }: CompletedQuestionCardProps) => {
  const categoryName = item.question.primaryCategory?.name || "생활습관";

  const completedDate = (() => {
    const date = new Date(item.completedAt);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  })();

  return (
    <article className="w-full flex items-start gap-4 sm:gap-5 md:gap-6 p-5 sm:p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
      {/* 썸네일 */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden ring-1 ring-gray-100">
        <Image
          src={item.question.thumbnailUrl || "/placeholder.png"}
          alt={`${item.question.title} 썸네일`}
          width={96}
          height={96}
          className="w-full h-full object-cover"
          sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
        />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <span
          className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold mb-2 border border-blue-200"
          aria-label={`카테고리: ${categoryName}`}
        >
          {categoryName}
        </span>

        <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg mb-2 line-clamp-2 leading-tight">
          {item.question.title}
        </h3>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <time dateTime={item.completedAt}>완료일: {completedDate}</time>
        </div>
      </div>
    </article>
  );
};

export default async function UserCompletedPage({
  searchParams,
}: {
  searchParams: { userId?: string; userName?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = searchParams?.userId;
  const userName = searchParams?.userName || "";
  const pageParam = searchParams?.page;
  const currentPage =
    typeof pageParam === "string" && !Number.isNaN(Number(pageParam))
      ? Math.max(1, Number(pageParam))
      : 1;

  // 로그인 확인
  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="건강 질문 내역"
          description="건강 질문 내역을 확인하려면 로그인이 필요합니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="mb-8">
            <div className="text-gray-400 text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-8">
              건강 질문 내역을 확인하려면 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              로그인하기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!userId || typeof userId !== "string") {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="건강 질문 내역 오류"
          description="사용자 정보를 찾을 수 없습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              사용자 정보를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              올바르지 않은 접근이거나 사용자 정보가 없습니다.
            </p>
            <Link
              href="/my"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              마이페이지로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const token = await getServerToken();
  let completedQuestions: UserCompletedResult[] = [];
  let pagination: PaginationInfo | null = null;
  let error: string | null = null;

  try {
    const response: UserCompletedResponse =
      await getUserCompletedQuestionsServer(
        {
          userId,
          page: currentPage,
          limit: LIMIT,
        },
        token
      );
    completedQuestions = response.data?.results || [];
    pagination = response.data?.pagination || null;
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

    error = errorMessage;
  }

  const displayName = (typeof userName === "string" && userName) || "사용자";

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("userId", userId);
    if (userName) params.set("userName", userName);
    if (page > 1) params.set("page", String(page));
    return `/health-questions/user-completed?${params.toString()}`;
  };

  const hasPrev = pagination?.hasPrevPage && currentPage > 1;
  const hasNext = pagination?.hasNextPage;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${displayName}의 건강 질문 내역`}
        description={`${displayName}님이 완료한 건강 질문 내역을 확인하세요.`}
        noindex={true}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 페이지 헤더 */}
        <header className="mb-6 md:mb-8">
          <nav aria-label="브레드크럼 네비게이션" className="mb-4">
          <Link
            href="/my"
              className="inline-flex items-center gap-2 px-3 py-2 -ml-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm md:text-base font-medium min-h-[44px]"
            aria-label="마이페이지로 돌아가기"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>뒤로가기</span>
          </Link>
          </nav>

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {displayName}의 건강 질문 내역
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              완료한 건강 질문 결과를 다시 확인해보세요.
            </p>
          </div>
        </header>

        {/* 에러 상태 */}
        {error ? (
          <section
            className="bg-white rounded-lg shadow-sm border-2 border-red-100 p-8 md:p-12 text-center"
            aria-live="polite"
          >
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href={buildPageUrl(1)}
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              다시 시도
            </Link>
          </section>
        ) : (
          <>
            {/* 질문 목록 */}
            <section
              aria-label="완료한 건강 질문 목록"
              className="space-y-4 md:space-y-5"
            >
              {completedQuestions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    질문이 없습니다
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    완료한 건강 질문이 없습니다.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="space-y-4 md:space-y-5" role="list">
                    {completedQuestions.map((item) => (
                      <li key={`completed-${item.id}`}>
                        <Link
                          href={`/health-questions/${item.questionId}/result`}
                          className="block group"
                          aria-label={`${item.question.title} 결과 다시 보기`}
                        >
                          <CompletedQuestionCard item={item} />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* 페이지네이션 */}
                  {(hasPrev || hasNext) && (
                    <nav
                      className="flex items-center justify-between mt-8"
                      aria-label="페이지 탐색"
                    >
                      <div>
                        {hasPrev ? (
                          <Link
                            href={buildPageUrl(currentPage - 1)}
                            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 border border-gray-200 rounded-lg text-sm sm:text-base text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium min-h-[44px] shadow-sm hover:shadow-md"
                            aria-label="이전 페이지"
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
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                            <span>이전</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 border border-gray-100 rounded-lg text-sm sm:text-base text-gray-300 bg-gray-50 cursor-not-allowed min-h-[44px]">
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
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                            <span>이전</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        {pagination
                          ? `${pagination.currentPage} / ${pagination.totalPages}`
                          : null}
                      </p>
                      <div>
                        {hasNext ? (
                          <Link
                            href={buildPageUrl(currentPage + 1)}
                            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 border border-gray-200 rounded-lg text-sm sm:text-base text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium min-h-[44px] shadow-sm hover:shadow-md"
                            aria-label="다음 페이지"
                          >
                            <span>다음</span>
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
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 border border-gray-100 rounded-lg text-sm sm:text-base text-gray-300 bg-gray-50 cursor-not-allowed min-h-[44px]">
                            <span>다음</span>
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
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </nav>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
