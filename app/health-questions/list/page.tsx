import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import QuestionListClient from "../../components/QuestionListClient";
import {
  getHealthQuestionsServer,
  getServerToken,
} from "../../../lib/api-server";
import type { HealthQuestionDetail } from "../../types/health-questions";
import { generatePageMetadata } from "../../../lib/metadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 동적 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
  try {
    const token = await getServerToken();
    const data = await getHealthQuestionsServer(10, undefined, token);
    const metadata = generatePageMetadata("health-questions", {
      title: `건강 질문 - ${data.questions.length}개의 질문이 있습니다`,
      description: `${data.questions.length}개의 건강 질문을 통해 나의 건강 상태를 확인해보세요.`,
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
  } catch (error) {
    return {
      title: "건강 질문",
      description:
        "다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요.",
    };
  }
}

// ✅ Server Component: 서버에서 초기 데이터 가져오기
export default async function HealthQuestionsList() {
  let questions: HealthQuestionDetail[] = [];
  let nextCursor: string | null = null;
  let error: string | null = null;

  try {
    const token = await getServerToken();
    const data = await getHealthQuestionsServer(10, undefined, token);
    questions = data.questions || [];
    nextCursor = data.nextCursor || null;
  } catch (err) {
    console.error("질문목록 로딩 실패:", err);
    error = "질문목록을 불러오는데 실패했습니다.";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ✅ SEO & 디자인: 헤더 섹션 */}
        <section className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            건강 질문
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요.
          </p>
        </section>

        {/* ✅ 에러 상태 */}
        {error && (
          <div className="max-w-md mx-auto text-center mb-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
            </div>
          </div>
        )}

        {/* ✅ SEO: 질문 목록 섹션 */}
        {questions.length > 0 ? (
          <section aria-label="건강 질문 목록">
            <QuestionListClient
              initialQuestions={questions}
              initialNextCursor={nextCursor}
            />
          </section>
        ) : (
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
