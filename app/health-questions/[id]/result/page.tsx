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
    <div className="min-h-screen bg-white">
      <SEO
        title="퀴즈 결과"
        description="건강 질문 퀴즈 결과를 확인하세요."
        noindex={true}
      />

      {/* 공통 헤더 */}
      <Header />

      <div className="flex flex-col items-center justify-center min-h-screen px-4 md:px-6 py-8">
        {/* 결과 내용 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-4 sm:mb-6">
            나의 점수
          </h1>

          {/* 점수 표시 */}
          <div className="text-5xl sm:text-6xl font-bold text-teal-500 mb-4">
            25
          </div>

          {/* 피드백 태그 */}
          <div className="inline-flex items-center bg-teal-50 text-teal-700 px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm sm:text-base">뛰어난 스트레스 관리</span>
          </div>

          {/* 설명 텍스트 */}
          <div className="text-black text-base sm:text-lg leading-relaxed px-2">
            <p className="mb-2">
              스트레스를 잘 관리하고 있습니다! 현재의 방식 그대로,
            </p>
            <p>스트레스를 효과적으로 대처하고 있는 상태입니다.</p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="w-full max-w-md flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <button
            onClick={handleRetake}
            className="w-full sm:w-auto flex items-center justify-center text-black hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
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
            <span className="text-sm sm:text-base">다시 풀기</span>
          </button>

          <button
            onClick={handleBackToList}
            className="w-full sm:w-auto flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <span className="text-sm sm:text-base">목록으로</span>
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 ml-2"
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
          </button>
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
};

export default ResultPage;
