import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import HealthQuestionActions from "../../components/HealthQuestionActions";
import { getHealthQuestionDetailServer } from "../../../lib/api-server";
import type { HealthQuestionDetail } from "../../types/health-questions";
import { generateHealthQuestionMetadata } from "../../../lib/metadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const { getServerTokens } = await import("../../../lib/api-server");
    const tokens = await getServerTokens();
    const question = await getHealthQuestionDetailServer(
      params.id,
      tokens.accessToken,
      tokens.refreshToken
    );
    const metadata = generateHealthQuestionMetadata({
      title: question.title,
      description: question.description || question.title,
      category: question.primaryCategory.name,
    });

    const ogImage =
      question.detailThumbnailUrl || question.thumbnailUrl || "/og-image.png";
    const fullOgImage = ogImage.startsWith("http")
      ? ogImage
      : `${siteUrl}${ogImage}`;
    const canonicalUrl = `${siteUrl}/health-questions/${question.id}`;

    return {
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
      openGraph: {
        title: metadata.ogTitle || metadata.title,
        description: metadata.ogDescription || metadata.description,
        images: [
          {
            url: fullOgImage,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: question.title,
          },
        ],
        url: canonicalUrl,
      },
      twitter: {
        card: "summary_large_image",
        title: metadata.ogTitle || metadata.title,
        description: metadata.ogDescription || metadata.description,
        images: [fullOgImage],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    return {
      title: "건강 질문",
      description: "건강 질문 정보를 불러오는 중입니다.",
    };
  }
}

// ✅ Server Component: 서버에서 데이터 가져오기
export default async function HealthQuestionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let question: HealthQuestionDetail | null = null;
  let error: string | null = null;

  try {
    const { getServerTokens } = await import("../../../lib/api-server");
    const tokens = await getServerTokens();
    question = await getHealthQuestionDetailServer(
      params.id,
      tokens.accessToken,
      tokens.refreshToken
    );
  } catch (err: unknown) {
    const axiosError = err as {
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
    };
    console.error("❌ [HealthQuestionDetailPage] 질문 상세 로딩 실패:", {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
    });
    error = "질문 정보를 불러올 수 없습니다.";
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8 sm:p-10">
              <div
                className="text-red-500 text-5xl sm:text-6xl mb-4"
                role="img"
                aria-label="경고"
              >
                ⚠️
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                질문을 찾을 수 없습니다
              </h1>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {error || "질문을 찾을 수 없습니다."}
              </p>
              <Link
                href="/health-questions/list"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium text-sm sm:text-base min-h-[44px] shadow-sm hover:shadow-md"
                aria-label="질문 목록으로 이동"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span>질문 목록으로</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 뒤로가기 버튼 */}
        <nav aria-label="브레드크럼 네비게이션" className="mb-6">
          <Link
            href="/health-questions/list"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm md:text-base font-medium min-h-[44px]"
            aria-label="질문 목록으로 돌아가기"
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
            <span>목록으로</span>
          </Link>
        </nav>

        {/* 질문 카드 */}
        <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
          <header className="p-6 sm:p-8 border-b border-gray-100">
            {/* 카테고리 태그 */}
            <div className="mb-4">
              <span
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border border-blue-200"
                aria-label={`카테고리: ${question.primaryCategory.name}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                {question.primaryCategory.name}
              </span>
            </div>

            {/* 제목 */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {question.title}
            </h1>

            {/* 메타 정보 */}
            <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-gray-600">
              <span className="flex items-center gap-1.5">
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                총 {question.questionCount}문항
              </span>
              <span className="flex items-center gap-1.5">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                소요시간 {Math.floor(question.durationSeconds / 60)}분{" "}
                {question.durationSeconds % 60}초
              </span>
            </div>
          </header>

          <div className="p-6 sm:p-8">
            {/* 썸네일 이미지 */}
            <div className="mb-8">
              <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                <Image
                  src={question.detailThumbnailUrl || question.thumbnailUrl}
                  alt={question.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                  priority
                />
              </div>
            </div>

            {/* 설명 */}
            <section className="mb-8">
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4">
                {question.description}
              </p>
              {question.detailDescription && (
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {question.detailDescription}
                </p>
              )}
            </section>

            {/* 질문 목록 미리보기 */}
            <section className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                질문 미리보기
              </h2>
              <ul className="space-y-3" role="list">
                {question.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span
                      className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5"
                      aria-label={`질문 ${item.order}`}
                    >
                      {item.order}
                    </span>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed flex-1">
                      {item.content}
                    </p>
                  </li>
                ))}
                {question.items.length > 3 && (
                  <li className="text-sm text-gray-500 pt-2">
                    ... 외 {question.items.length - 3}개 질문
                  </li>
                )}
              </ul>
            </section>

            {/* 통계 정보 */}
            <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                통계 정보
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                    {question.viewCount.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">조회수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                    {question.questionCount}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    문항 수
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
                    {Math.floor(question.durationSeconds / 60)}분
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    소요시간
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl sm:text-3xl font-bold mb-1 ${
                      question.userProgress?.isCompleted
                        ? "text-purple-600"
                        : "text-gray-600"
                    }`}
                  >
                    {question.userProgress?.isCompleted ? "완료" : "미완료"}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    진행상태
                  </div>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* 버튼 영역 - Client Component */}
        <div className="text-center">
          <HealthQuestionActions
            questionId={question.id}
            isCompleted={question.userProgress?.isCompleted || false}
            title={question.title}
            description={question.description || question.title}
            imageUrl={
              question.detailThumbnailUrl || question.thumbnailUrl || undefined
            }
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
