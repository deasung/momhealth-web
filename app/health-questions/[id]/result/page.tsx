"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SEO from "../../../components/SEO";
import { getMyQuestionResult, type QuestionResult } from "@/lib/api";

const ResultPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [result, setResult] = useState<QuestionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!id || !isClient) return;

    let cancelled = false;

    const fetchResult = async () => {
      try {
        // 로딩 상태를 다시 true로 설정하여 데이터 페칭 중임을 명확히 함
        setLoading(true);
        const data = await getMyQuestionResult(id);
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          let message = "결과를 불러오는 중 오류가 발생했습니다.";

          if (err && typeof err === "object" && "response" in err) {
            const apiError = err as {
              response?: { status?: number };
            };
            if (apiError.response?.status === 404) {
              message = "결과가 없습니다. 먼저 퀴즈를 완료해주세요.";
            } else if (apiError.response?.status === 401) {
              message = "로그인이 필요합니다.";
            }
          }

          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchResult();

    return () => {
      cancelled = true;
    };
  }, [id, isClient]);

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
        {/* Hydration 오류 방지를 위해 페이지 구조는 유지하고, 컨텐츠만 조건부 렌더링 */}
        {!isClient || loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        ) : (
          <article className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 sm:p-10 md:p-12">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">
                나의 점수
              </h1>

              <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-teal-500 mb-6 drop-shadow-sm">
                {result?.score ?? "-"}
              </div>

              <div
                className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full mb-6 sm:mb-8 border border-teal-200 shadow-sm"
                role="status"
                aria-label={
                  result?.riskLevel ? `피드백: ${result.riskLevel}` : "피드백"
                }
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
                  {result?.result.title || "결과 없음"}
                </span>
              </div>

              <div className="text-gray-700 text-base sm:text-lg leading-relaxed px-2 sm:px-4">
                {error ? (
                  <p>{error}</p>
                ) : (
                  <>
                    <div
                      className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-4 sm:p-5 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_p:empty]:block [&_p:empty]:h-4"
                      dangerouslySetInnerHTML={{
                        __html:
                          result?.result.description ||
                          "퀴즈 결과 설명을 확인할 수 없습니다.",
                      }}
                    />
                    {result?.result.linkUrl && (
                      <div className="mt-4">
                        <a
                          href={result.result.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-700 px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base font-semibold border border-orange-200 min-h-[44px]"
                          aria-label={
                            result.result.linkUrlName
                              ? `${result.result.linkUrlName} 새 창으로 열기`
                              : "관련 링크 새 창으로 열기"
                          }
                        >
                          <span>
                            {result.result.linkUrlName || "관련 링크"}
                          </span>
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
                              d="M14 3h7m0 0v7m0-7L10 14"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10v11a1 1 0 001 1h11"
                            />
                          </svg>
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

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
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ResultPage;
