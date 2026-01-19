import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import QuestionListClient from "../../components/QuestionListClient";
import { getHealthQuestionsServer } from "../../../lib/api-server";
import type { HealthQuestionDetail } from "../../types/health-questions";
import type { QuestionListItemDTO } from "../../types/dto";
import { generatePageMetadata } from "../../../lib/metadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// 동적 렌더링 강제 (searchParams와 headers 사용)
export const dynamic = "force-dynamic";

// ✅ SEO: 정적 메타데이터 (빌드 시점 에러 방지 - headers 사용 불가)
export async function generateMetadata(): Promise<Metadata> {
  // generateMetadata는 빌드 시점에도 실행될 수 있으므로 headers()를 사용하는 함수 호출 제거
  const metadata = generatePageMetadata("health-questions", {
    title: "건강 질문",
    description:
      "다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요.",
  });

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: {
      title: metadata.ogTitle || metadata.title,
      description: metadata.ogDescription || metadata.description,
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: "건강 질문 - 다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요",
        },
      ],
      url: `${siteUrl}/health-questions/list`,
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.ogTitle || metadata.title,
      description: metadata.ogDescription || metadata.description,
      images: [`${siteUrl}/og-image.png`],
    },
    alternates: {
      canonical: `${siteUrl}/health-questions/list`,
    },
  };
}

// ✅ Server Component: 서버에서 초기 데이터 가져오기
export default async function HealthQuestionsList({
  searchParams,
}: {
  searchParams: {
    q?: string;
    title?: string;
    description?: string;
    categoryId?: string;
    primaryCategoryId?: string;
    secondaryCategoryId?: string;
  };
}) {
  let questions: QuestionListItemDTO[] = [];
  let nextCursor: string | null = null;
  let error: string | null = null;

  try {
    const { getServerTokens } = await import("../../../lib/api-server");
    const tokens = await getServerTokens();

    // 검색 옵션 구성 (q 파라미터를 title과 description으로 변환)
    const searchQuery =
      searchParams?.q || searchParams?.title || searchParams?.description;
    const searchOptions = {
      title: searchQuery,
      description: searchQuery,
      categoryId: searchParams?.categoryId,
      primaryCategoryId: searchParams?.primaryCategoryId,
      secondaryCategoryId: searchParams?.secondaryCategoryId,
    };

    // 질문 목록 가져오기
    const data = await getHealthQuestionsServer(
      10,
      undefined,
      tokens.accessToken,
      tokens.refreshToken,
      searchOptions
    );

    // ✅ RSC Payload 최적화: DTO 패턴 적용 - 필요한 필드만 추출
    questions = (data.questions || []).map((q: HealthQuestionDetail) => ({
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
    nextCursor = data.nextCursor || null;
  } catch (err: unknown) {
    const axiosError = err as {
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
    };
    console.error("❌ [HealthQuestionsList] 질문목록 로딩 실패:", {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
    });
    error = "질문목록을 불러오는데 실패했습니다.";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ✅ SEO & 디자인: 헤더 섹션 */}
        <section className="mb-8 md:mb-12">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            건강 질문
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요.
          </p>
        </section>

        {/* ✅ 에러 상태 */}
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
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
                aria-label="홈으로 이동"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>홈으로</span>
              </Link>
            </div>
          </div>
        )}

        {/* ✅ SEO: 질문 목록 섹션 */}
        <section aria-label="건강 질문 목록">
          <QuestionListClient
            initialQuestions={questions}
            initialNextCursor={nextCursor}
            initialSearchParams={searchParams}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
