import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getQuizItems, submitQuizAnswers } from "../../../lib/api";
import { QuizData, QuizAnswer } from "../../../types/health-questions";

// 정적 생성에서 제외하고 동적으로 렌더링
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

const QuizPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;

      setLoading(true);
      setCurrent(0);
      setAnswers([]);

      try {
        const data = await getQuizItems(id as string);
        setQuiz(data);
      } catch (error) {
        console.error("퀴즈 문항 로딩 실패:", error);
        alert("퀴즈 문항을 불러오는 데 실패했습니다.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, router]);

  const items = quiz?.items || [];
  const currentItem = items[current];
  const selectedChoiceId = answers.find(
    (a) => a.itemId === currentItem?.id
  )?.choiceId;
  const isLastQuestion = current === items.length - 1;

  const handleSelect = (itemId: string, choiceId: string) => {
    setAnswers((prev) => {
      const newAnswers = prev.some((a) => a.itemId === itemId)
        ? prev.map((a) => (a.itemId === itemId ? { ...a, choiceId } : a))
        : [...prev, { itemId, choiceId }];

      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (!id) return;

    // 제출 전 데이터 확인
    console.log("=== 퀴즈 제출 데이터 확인 ===");
    console.log("질문 ID:", id);
    console.log("답변 데이터:", answers);
    console.log("답변 개수:", answers.length);
    console.log("전체 문항 수:", items.length);

    // 답변 데이터 상세 확인
    answers.forEach((answer, index) => {
      console.log(`답변 ${index + 1}:`, {
        itemId: answer.itemId,
        choiceId: answer.choiceId,
        questionTitle: items.find((item) => item.id === answer.itemId)?.title,
        selectedChoice: items
          .find((item) => item.id === answer.itemId)
          ?.choices.find((choice) => choice.id === answer.choiceId)?.text,
      });
    });

    try {
      setSubmitting(true);
      console.log("API 호출 시작...");
      await submitQuizAnswers(id as string, answers);
      console.log("API 호출 성공!");
      // 결과 페이지로 이동 (추후 구현)
      router.push(`/health-questions/${id}/result`);
    } catch (error) {
      console.error("퀴즈 제출 실패:", error);
      console.error("에러 상세:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });
      alert("퀴즈 제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handlePrevious = () => {
    setCurrent((c) => c - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">퀴즈 문항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">퀴즈 문항이 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            퀴즈 문항 정보를 불러올 수 없습니다.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>건강 질문 퀴즈</title>
      </Head>

      {/* 공통 헤더 */}
      <Header />

      {/* 진행률 바 */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-full"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex-1 mx-2 sm:mx-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((current + 1) / items.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-2 sm:px-3 py-1">
              <span className="text-yellow-600 text-xs sm:text-sm font-medium">
                {current + 1}/{items.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 질문 및 선택지 */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-2xl font-bold text-black mb-6 sm:mb-10 leading-6 sm:leading-8">
            {currentItem.title}
          </h2>

          <div className="space-y-2 sm:space-y-3">
            {currentItem.choices.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelect(currentItem.id, choice.id)}
                  className={`w-full flex items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                    isSelected
                      ? "bg-orange-50 border-2 border-orange-500"
                      : "bg-orange-50 border border-transparent hover:bg-orange-100"
                  }`}
                >
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-orange-500 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </div>
                  <span className="text-sm sm:text-lg font-medium text-black text-left">
                    {choice.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <button
            onClick={handlePrevious}
            disabled={current === 0}
            className={`flex items-center px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors ${
              current === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-black hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
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
            <span className="text-sm sm:text-base">이전</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!selectedChoiceId || submitting}
            className={`flex items-center px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors ${
              selectedChoiceId && !submitting
                ? isLastQuestion
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span className="mr-1 sm:mr-2 text-sm sm:text-base">
              {isLastQuestion ? (submitting ? "제출 중..." : "제출") : "다음"}
            </span>
            {isLastQuestion ? (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
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
            )}
          </button>
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
};

export default QuizPage;
