"use client";

import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SEO from "../../../components/SEO";

const ResultPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const handleRetake = () => {
    router.push(`/health-questions/${id}/quiz`);
  };

  const handleBackToList = () => {
    router.push("/health-questions/list");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO
        title="퀴즈 결과"
        description="건강 질문 퀴즈 결과를 확인하세요."
        noindex={true}
      />

      <Header />

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 py-8 md:py-12">
        {/* 결과 카드 */}
        <article className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 sm:p-10 md:p-12">
          {/* 결과 내용 */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">
              나의 점수
            </h1>

            {/* 점수 표시 */}
            <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-teal-500 mb-6 drop-shadow-sm">
              25
            </div>

            {/* 피드백 태그 */}
            <div
              className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full mb-6 sm:mb-8 border border-teal-200 shadow-sm"
              role="status"
              aria-label="피드백: 뛰어난 스트레스 관리"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm sm:text-base font-semibold">
                뛰어난 스트레스 관리
              </span>
            </div>

            {/* 설명 텍스트 */}
            <div className="text-gray-700 text-base sm:text-lg leading-relaxed px-2 sm:px-4">
              <p className="mb-2">
                스트레스를 잘 관리하고 있습니다! 현재의 방식 그대로,
              </p>
              <p>스트레스를 효과적으로 대처하고 있는 상태입니다.</p>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleRetake}
              className="inline-flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 px-6 py-3 rounded-xl transition-colors font-medium text-sm sm:text-base min-h-[44px] border border-gray-200"
              aria-label="퀴즈 다시 풀기"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>다시 풀기</span>
            </button>

            <button
              onClick={handleBackToList}
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-6 py-3 rounded-xl transition-colors font-medium text-sm sm:text-base min-h-[44px] shadow-md hover:shadow-lg"
              aria-label="질문 목록으로 이동"
            >
              <span>목록으로</span>
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
            </button>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default ResultPage;
