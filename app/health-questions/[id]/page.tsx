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
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                질문을 찾을 수 없습니다
              </h2>
              <p className="text-gray-600 mb-6">
                {error || "질문을 찾을 수 없습니다."}
              </p>
              <Link
                href="/health-questions/list"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                질문 목록으로
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 카테고리 태그 */}
        <div className="mb-4">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            {question.primaryCategory.name}
          </div>
        </div>

        {/* 제목 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {question.title}
        </h1>

        {/* 메타 정보 */}
        <div className="flex items-center text-gray-600 mb-6">
          <span className="mr-4">총 {question.questionCount}문항</span>
          <span>소요시간 {question.durationSeconds}초</span>
        </div>

        {/* 썸네일 이미지 */}
        <div className="mb-8">
          <Image
            src={question.detailThumbnailUrl || question.thumbnailUrl}
            alt={question.title}
            width={800}
            height={256}
            className="w-full h-64 object-cover rounded-lg shadow-md"
            unoptimized
          />
        </div>

        {/* 설명 */}
        <div className="mb-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            {question.description}
          </p>
          {question.detailDescription && (
            <p className="text-gray-600 mt-4">{question.detailDescription}</p>
          )}
        </div>

        {/* 질문 목록 미리보기 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            질문 미리보기
          </h2>
          <div className="space-y-3">
            {question.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3 mt-1">
                  {item.order}
                </span>
                <p className="text-gray-700">{item.content}</p>
              </div>
            ))}
            {question.items.length > 3 && (
              <p className="text-gray-500 text-sm">
                ... 외 {question.items.length - 3}개 질문
              </p>
            )}
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {question.viewCount}
              </div>
              <div className="text-sm text-gray-600">조회수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {question.questionCount}
              </div>
              <div className="text-sm text-gray-600">문항 수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {question.durationSeconds}초
              </div>
              <div className="text-sm text-gray-600">소요시간</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {question.userProgress?.isCompleted ? "완료" : "미완료"}
              </div>
              <div className="text-sm text-gray-600">진행상태</div>
            </div>
          </div>
        </div>

        {/* 버튼 영역 - Client Component */}
        <div className="text-center">
          <HealthQuestionActions
            questionId={question.id}
            isCompleted={question.userProgress?.isCompleted || false}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
