import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import { getHealthQuestions } from "../../lib/api";
import type { HealthQuestionDetail } from "../../types/health-questions";
import { useTokenSync } from "../../lib/hooks/useTokenSync";

export default function HealthQuestionsList() {
  const [questions, setQuestions] = useState<HealthQuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // const router = useRouter(); // 현재 사용하지 않음
  const { isTokenSynced } = useTokenSync();

  // 초기 데이터 로드
  useEffect(() => {
    if (!isTokenSynced) return;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getHealthQuestions(10);
        setQuestions(data.questions);
        setNextCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        console.error("질문목록 로딩 실패:", err);
        setError("질문목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [isTokenSynced]);

  // 더 많은 데이터 로드
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const data = await getHealthQuestions(10, nextCursor);

      setQuestions((prev) => [...prev, ...data.questions]);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      console.error("추가 질문목록 로딩 실패:", err);
      setError("추가 질문목록을 불러오는데 실패했습니다.");
    } finally {
      setLoadingMore(false);
    }
  };

  // 질문 카드 컴포넌트
  const QuestionCard = ({ question }: { question: HealthQuestionDetail }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="flex">
        {/* 썸네일 */}
        <div className="w-24 h-24 flex-shrink-0">
          <img
            src={question.thumbnailUrl}
            alt={question.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 내용 */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                {question.title}
              </h3>
              <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                {question.description}
              </p>

              {/* 카테고리 */}
              <div className="flex flex-wrap gap-1 mb-2">
                {question.primaryCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {question.primaryCategory.name}
                  </span>
                )}
                {question.secondaryCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {question.secondaryCategory.name}
                  </span>
                )}
              </div>

              {/* 메타 정보 */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>질문 {question.questionCount}개</span>
                {question.durationSeconds && (
                  <span>{question.durationSeconds}초</span>
                )}
                <span>조회 {question.viewCount}</span>
              </div>
            </div>

            {/* 시작 버튼 */}
            <div className="ml-3">
              <Link
                href={`/health-questions/${question.id}`}
                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-medium rounded-lg hover:from-pink-600 hover:to-orange-600 transition-colors"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
        <Head>
          <title>질문목록 | 오늘의 건강</title>
          <meta name="description" content="건강 관련 질문목록을 확인하세요" />
        </Head>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">질문목록을 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
        <Head>
          <title>질문목록 | 오늘의 건강</title>
        </Head>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <Head>
        <title>질문목록 | 오늘의 건강</title>
        <meta name="description" content="건강 관련 질문목록을 확인하세요" />
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            건강 질문목록
          </h1>
          <p className="text-gray-600">
            다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요.
          </p>
        </div>

        {/* 질문 목록 */}
        <div className="space-y-4 mb-8">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  로딩 중...
                </div>
              ) : (
                "더 많은 질문 보기"
              )}
            </button>
          </div>
        )}

        {/* 더 이상 질문이 없을 때 */}
        {!hasMore && questions.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">모든 질문을 확인했습니다.</p>
          </div>
        )}

        {/* 질문이 없을 때 */}
        {questions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              질문이 없습니다
            </h3>
            <p className="text-gray-600">아직 등록된 질문이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
