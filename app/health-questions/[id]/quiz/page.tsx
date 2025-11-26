"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SEO from "../../../components/SEO";
import {getQuizItems, submitQuizAnswers} from "../../../../lib/api";
import {QuizAnswer, QuizData} from "../../../types/health-questions";

const QuizPage = () => {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null); // ✅ UX: 에러 상태 추가
    const [showErrorModal, setShowErrorModal] = useState(false); // ✅ UX: 에러 모달 상태

    // ✅ 성능: 퀴즈 데이터 가져오기 메모이제이션
    const fetchQuiz = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setCurrent(0);
        setAnswers([]);
        setError(null);

        try {
            const data = await getQuizItems(id);
            setQuiz(data);
        } catch (error) {
            console.error("퀴즈 문항 로딩 실패:", error);
            // ✅ UX: alert 제거, 에러 상태 설정
            setError("퀴즈 문항을 불러오는 데 실패했습니다.");
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    // ✅ 성능: 계산값 메모이제이션
    const items = useMemo(() => quiz?.items || [], [quiz?.items]);
    const currentItem = useMemo(() => items[current], [items, current]);
    const selectedChoiceId = useMemo(
        () => answers.find((a) => a.itemId === currentItem?.id)?.choiceId,
        [answers, currentItem?.id]
    );
    const isLastQuestion = useMemo(
        () => current === items.length - 1,
        [current, items.length]
    );
    const progress = useMemo(
        () => ((current + 1) / items.length) * 100,
        [current, items.length]
    );

    // ✅ 성능: 핸들러 메모이제이션
    const handleSelect = useCallback((itemId: string, choiceId: string) => {
        console.log("handleSelect", itemId, choiceId);

        // ✅ 유효성 검사: itemId와 choiceId가 유효한 값인지 확인
        if (
            !itemId ||
            itemId === null ||
            itemId === undefined ||
            itemId === "" ||
            !choiceId ||
            choiceId === null ||
            choiceId === undefined ||
            choiceId === ""
        ) {
            console.error("유효하지 않은 itemId 또는 choiceId:", {
                itemId,
                choiceId,
            });
            setError("답변 선택 중 오류가 발생했습니다. 다시 시도해주세요.");
            setShowErrorModal(true);
            return;
        }

        setAnswers((prev) => {
            const newAnswers = prev.some((a) => a.itemId === itemId)
                ? prev.map((a) => (a.itemId === itemId ? {...a, choiceId} : a))
                : [...prev, {itemId, choiceId}];

            console.log(newAnswers);

            return newAnswers;
        });
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!id) return;

        try {
            setSubmitting(true);
            setError(null);

            // ✅ 유효성 검사: 모든 질문에 답변이 있는지 확인
            const unansweredItems = items.filter(
                (item) => !answers.some((answer) => answer.itemId === item.id)
            );

            if (unansweredItems.length > 0) {
                setError(
                    `모든 질문에 답변해주세요. (${unansweredItems.length}개 질문 미답변)`
                );
                setShowErrorModal(true);
                setSubmitting(false);
                return;
            }

            // ✅ 유효성 검사: itemId와 choiceId가 유효한 값인지 확인 및 필터링
            const validAnswers = answers.filter(
                (answer) =>
                    answer.itemId &&
                    answer.itemId !== null &&
                    answer.itemId !== undefined &&
                    answer.itemId !== "" &&
                    answer.choiceId &&
                    answer.choiceId !== null &&
                    answer.choiceId !== undefined &&
                    answer.choiceId !== ""
            );

            if (validAnswers.length !== items.length) {
                setError(`일부 답변이 유효하지 않습니다. 모든 질문에 답변해주세요.`);
                setShowErrorModal(true);
                setSubmitting(false);
                return;
            }

            // ✅ 타입 변환: itemId를 questionId로 매핑
            const formattedAnswers = validAnswers.map((answer) => ({
                questionId: String(answer.itemId),
                choiceId: String(answer.choiceId),
            }));

            console.log("제출할 답변 데이터:", formattedAnswers);

            await submitQuizAnswers(id, formattedAnswers);
            // ✅ UX: 제출 성공 후 결과 페이지로 이동
            router.push(`/health-questions/${id}/result`);
        } catch (error: unknown) {
            console.error("퀴즈 제출 실패:", error);
            // ✅ UX: alert 제거, 에러 모달 표시
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "퀴즈 제출 중 오류가 발생했습니다.";
            setError(errorMessage);
            setShowErrorModal(true);
        } finally {
            setSubmitting(false);
        }
    }, [id, answers, items, router]);

    const handleNext = useCallback(() => {
        if (isLastQuestion) {
            handleSubmit();
        } else {
            setCurrent((c) => c + 1);
            // ✅ UX: 다음 질문으로 스크롤
            window.scrollTo({top: 0, behavior: "smooth"});
        }
    }, [isLastQuestion, handleSubmit]);

    const handlePrevious = useCallback(() => {
        setCurrent((c) => c - 1);
        // ✅ UX: 이전 질문으로 스크롤
        window.scrollTo({top: 0, behavior: "smooth"});
    }, []);

    // ✅ UX: 스켈레톤 UI 컴포넌트
    const SkeletonQuiz = () => (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
            <div className="mb-8">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-6 animate-pulse"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-16 bg-gray-100 rounded-xl animate-pulse"
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SEO
                    title="건강 질문 퀴즈"
                    description="건강 질문 퀴즈를 진행 중입니다."
                    noindex={true}
                />
                <Header/>
                {/* ✅ UX: 진행률 바 스켈레톤 */}
                <div className="bg-gray-50 border-b border-gray-100">
                    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="flex-1 mx-4">
                                <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
                            </div>
                            <div className="w-16 h-6 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <SkeletonQuiz/>
                <Footer/>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SEO
                    title="퀴즈 오류"
                    description="퀴즈 문항이 없습니다."
                    noindex={true}
                />
                <Header/>
                <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                    <div className="max-w-md mx-auto text-center">
                        {/* ✅ UX: 빈 상태 개선 */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 mb-6">
                            <div className="text-yellow-500 text-5xl mb-4">📝</div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                퀴즈 문항이 없습니다
                            </h2>
                            <p className="text-gray-600 mb-6">
                                이 퀴즈에는 문항이 등록되어 있지 않습니다.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => router.back()}
                                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                >
                                    돌아가기
                                </button>
                                {id && (
                                    <button
                                        onClick={() => router.push(`/health-questions/${id}`)}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                    >
                                        질문 상세로
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                <Footer/>
            </div>
        );
    }

    if (!currentItem) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SEO
                    title="퀴즈 오류"
                    description="퀴즈 문항 정보를 불러올 수 없습니다."
                    noindex={true}
                />
                <Header/>
                <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                    <div className="max-w-md mx-auto text-center">
                        {/* ✅ UX: 에러 상태 개선 */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-6">
                            <div className="text-red-500 text-5xl mb-4">⚠️</div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                문항 정보를 불러올 수 없습니다
                            </h2>
                            <p className="text-gray-600 mb-6">
                                퀴즈 문항 정보를 불러오는 중 오류가 발생했습니다.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => router.back()}
                                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                >
                                    돌아가기
                                </button>
                                <button
                                    onClick={fetchQuiz}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                >
                                    다시 시도
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <SEO
                title="건강 질문 퀴즈"
                description="건강 질문 퀴즈를 진행해보세요."
                noindex={true}
            />

            <Header/>

            {/* ✅ 디자인: 진행률 바 개선 */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* ✅ UX: 뒤로가기 버튼 개선 */}
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                            aria-label="뒤로가기"
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
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        {/* ✅ 디자인: 진행률 바 시각적 개선 */}
                        <div className="flex-1 mx-2 sm:mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                                    style={{width: `${progress}%`}}
                                    role="progressbar"
                                    aria-valuenow={current + 1}
                                    aria-valuemin={1}
                                    aria-valuemax={items.length}
                                    aria-label={`질문 ${current + 1} / ${items.length}`}
                                />
                            </div>
                        </div>

                        {/* ✅ 디자인: 진행률 배지 개선 */}
                        <div
                            className="bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 rounded-lg px-3 sm:px-4 py-1.5 shadow-sm">
              <span className="text-orange-700 text-xs sm:text-sm font-semibold">
                {current + 1}/{items.length}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* ✅ SEO & 디자인: 질문 및 선택지 섹션 개선 */}
                <section className="mb-8 md:mb-12">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-10 leading-tight">
                        {currentItem.title}
                    </h2>

                    <div className="space-y-3 sm:space-y-4">
                        {currentItem.choices.map((choice) => {
                            const isSelected = selectedChoiceId === choice.id;
                            return (
                                <button
                                    key={choice.id}
                                    onClick={() => {
                                        // ✅ 유효성 검사: currentItem.id와 choice.id가 유효한지 확인
                                        if (
                                            !currentItem.id ||
                                            currentItem.id === null ||
                                            currentItem.id === undefined ||
                                            !choice.id ||
                                            choice.id === null ||
                                            choice.id === undefined
                                        ) {
                                            console.error("유효하지 않은 ID:", {
                                                itemId: currentItem.id,
                                                choiceId: choice.id,
                                            });
                                            setError(
                                                "답변 선택 중 오류가 발생했습니다. 페이지를 새로고침해주세요."
                                            );
                                            setShowErrorModal(true);
                                            return;
                                        }
                                        handleSelect(String(currentItem.id), String(choice.id));
                                    }}
                                    className={`w-full flex items-center p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                                        isSelected
                                            ? "bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-500 shadow-md scale-[1.02]"
                                            : "bg-white border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm"
                                    }`}
                                    aria-pressed={isSelected}
                                    aria-label={`${choice.text} 선택`}
                                >
                                    <div
                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-all ${
                                            isSelected
                                                ? "border-orange-500 bg-white shadow-sm"
                                                : "border-gray-300 bg-white"
                                        }`}
                                    >
                                        {isSelected && (
                                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"/>
                                        )}
                                    </div>
                                    <span className="text-base sm:text-lg md:text-xl font-medium text-gray-900 flex-1">
                    {choice.text}
                  </span>
                                    {isSelected && (
                                        <svg
                                            className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 ml-2 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ✅ 디자인: 하단 버튼 개선 */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-6 sm:pt-8">
                    <button
                        onClick={handlePrevious}
                        disabled={current === 0}
                        className={`flex items-center px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                            current === 0
                                ? "text-gray-400 cursor-not-allowed opacity-50"
                                : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                        }`}
                        aria-label="이전 질문"
                    >
                        <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
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
                        <span className="text-sm sm:text-base font-medium">이전</span>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!selectedChoiceId || submitting}
                        className={`flex items-center px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-all font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            selectedChoiceId && !submitting
                                ? isLastQuestion
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 shadow-md hover:shadow-lg focus:ring-orange-500"
                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200 active:bg-orange-300 focus:ring-orange-400"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed focus:ring-gray-400"
                        }`}
                        aria-label={isLastQuestion ? "퀴즈 제출" : "다음 질문"}
                    >
            <span className="mr-2 text-sm sm:text-base">
              {isLastQuestion ? (submitting ? "제출 중..." : "제출") : "다음"}
            </span>
                        {submitting ? (
                            <svg
                                className="w-5 h-5 sm:w-6 sm:h-6 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        ) : isLastQuestion ? (
                            <svg
                                className="w-5 h-5 sm:w-6 sm:h-6"
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
                                className="w-5 h-5 sm:w-6 sm:h-6"
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
            </main>

            <Footer/>

            {/* ✅ UX: 에러 모달 */}
            {showErrorModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowErrorModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="error-modal-title"
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <div
                                className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <h3
                                id="error-modal-title"
                                className="text-lg font-semibold text-gray-800 mb-2"
                            >
                                오류가 발생했습니다
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
                                {error}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setShowErrorModal(false);
                                        if (error?.includes("불러오는")) {
                                            router.back();
                                        }
                                    }}
                                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                >
                                    확인
                                </button>
                                {error?.includes("제출") && (
                                    <button
                                        onClick={() => {
                                            setShowErrorModal(false);
                                            handleSubmit();
                                        }}
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                    >
                                        다시 시도
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizPage;
