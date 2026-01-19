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
  getMappedUsersServer,
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
  };
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
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

// 동적 렌더링 강제 (headers 사용)
export const dynamic = "force-dynamic";

interface CompletedQuestionCardProps {
  item: UserCompletedResult;
  friendId: string;
}

const CompletedQuestionCard = ({
  item,
  friendId,
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
    <Link
      href={`/friends/${friendId}/questions/${item.questionId}`}
      className="block"
    >
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

        {/* 화살표 */}
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0"
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
      </article>
    </Link>
  );
};

export default async function FriendQuestionsPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { page?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = params.userId;
  const pageParam = searchParams?.page;
  const currentPage =
    typeof pageParam === "string" && !Number.isNaN(Number(pageParam))
      ? Math.max(1, Number(pageParam))
      : 1;

  // 로그인 확인
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="친구의 질문 내역"
          description="친구의 질문 내역을 확인하려면 로그인이 필요합니다."
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
              친구의 질문 내역을 확인하려면 로그인해주세요.
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
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="친구의 질문 내역"
          description="친구를 찾을 수 없습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            친구를 찾을 수 없습니다
          </h2>
          <Link
            href="/friends"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            친구 목록으로
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const token = await getServerToken();
  let completedQuestions: UserCompletedResult[] = [];
  let pagination: PaginationInfo | null = null;
  let friendName = "친구";
  let error: string | null = null;

  try {
    // 친구 정보 가져오기
    try {
      const friendsResponse = await getMappedUsersServer(token);
      const friend = friendsResponse.data?.friends?.find(
        (f) => String(f.friend.id) === userId
      );
      if (friend) {
        friendName = friend.friend.nickname;
      }
    } catch {
      // 친구 정보 가져오기 실패는 무시
    }

    // 친구의 완료한 질문 가져오기
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
        errorMessage = "친구를 찾을 수 없습니다.";
      } else if (apiError.response?.status === 403) {
        errorMessage = "접근 권한이 없습니다.";
      }
    }

    error = errorMessage;
  }

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    return `/friends/${userId}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
  };

  const hasPrev = pagination?.hasPrevPage && currentPage > 1;
  const hasNext = pagination?.hasNextPage;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${friendName}님의 질문 내역`}
        description={`${friendName}님이 완료한 건강 질문 내역을 확인해보세요.`}
        noindex={true}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 섹션 */}
        <section className="mb-8 md:mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/friends"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm md:text-base font-medium min-h-[44px]"
              aria-label="친구 목록으로 돌아가기"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>친구 목록</span>
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {friendName}님의 질문 내역
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            {friendName}님이 완료한 건강 질문을 확인해보세요.
          </p>
        </section>

        {/* 에러 상태 */}
        {error && (
          <div className="max-w-md mx-auto text-center py-12 md:py-16">
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8 sm:p-10">
              <div
                className="text-red-500 text-5xl sm:text-6xl mb-4"
                role="img"
                aria-label="경고"
              >
                ⚠️
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
              <Link
                href="/friends"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
                aria-label="친구 목록으로 이동"
              >
                <span>친구 목록으로</span>
              </Link>
            </div>
          </div>
        )}

        {/* 질문 목록 */}
        {!error && (
          <>
            {completedQuestions.length > 0 ? (
              <section aria-label="완료한 질문 목록">
                <div className="space-y-3">
                  {completedQuestions.map((item) => (
                    <CompletedQuestionCard
                      key={item.id}
                      item={item}
                      friendId={userId}
                    />
                  ))}
                </div>

                {/* 페이지네이션 */}
                {pagination && (hasPrev || hasNext) && (
                  <nav
                    className="mt-8 flex items-center justify-center gap-2"
                    aria-label="페이지네이션"
                  >
                    {hasPrev && (
                      <Link
                        href={buildPageUrl(currentPage - 1)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium min-h-[44px] inline-flex items-center justify-center"
                        aria-label="이전 페이지"
                      >
                        이전
                      </Link>
                    )}
                    <span className="px-4 py-2 text-sm text-gray-600">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    {hasNext && (
                      <Link
                        href={buildPageUrl(currentPage + 1)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium min-h-[44px] inline-flex items-center justify-center"
                        aria-label="다음 페이지"
                      >
                        다음
                      </Link>
                    )}
                  </nav>
                )}
              </section>
            ) : (
              <div className="text-center py-12 md:py-16">
                <div
                  className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 mb-6"
                  role="img"
                  aria-label="질문 없음"
                >
                  <span className="text-4xl sm:text-5xl">📝</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  완료한 질문이 없습니다
                </h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  {friendName}님이 아직 완료한 질문이 없습니다.
                </p>
                <Link
                  href="/friends"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] shadow-sm hover:shadow-md"
                  aria-label="친구 목록으로 돌아가기"
                >
                  <span>친구 목록으로</span>
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
