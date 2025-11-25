import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getHealthQuestions } from "../../lib/api";
import type { HealthQuestionDetail } from "../../types/health-questions";
import { useTokenSync } from "../../lib/hooks/useTokenSync";
import { generatePageMetadata } from "../../lib/metadata";

export default function HealthQuestionsList() {
  const [questions, setQuestions] = useState<HealthQuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

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
  const QuestionCard = ({ question }: { question: HealthQuestionDetail }) => {
    const [imageError, setImageError] = useState(false);
    const hasThumbnail = question.thumbnailUrl && !imageError;

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            {/* 왼쪽: 썸네일과 기본 정보 */}
            <div className="flex items-start gap-4 flex-1">
              {/* 썸네일 */}
              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                {hasThumbnail ? (
                  <img
                    src={question.thumbnailUrl}
                    alt={question.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-2xl">💊</div>
                )}
              </div>

              {/* 질문 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                  {question.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {question.description}
                </p>

                {/* 카테고리 태그 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {question.primaryCategory && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                      {question.primaryCategory.name}
                    </span>
                  )}
                  {question.secondaryCategory && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                      {question.secondaryCategory.name}
                    </span>
                  )}
                </div>

                {/* 메타 정보 */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>질문 {question.questionCount}개</span>
                  {question.durationSeconds && (
                    <span>{question.durationSeconds}초</span>
                  )}
                  <span>조회 {question.viewCount}</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 시작 버튼 */}
            <div className="ml-4 flex-shrink-0">
              <Link
                href={`/health-questions/${question.id}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="건강 질문"
          description="다양한 건강 질문을 통해 나의 건강 상태를 확인해보세요."
          keywords="건강 질문, 건강 체크, 건강 상태 확인"
        />
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">질문목록을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="질문 오류"
          description="질문목록을 불러오는 중 오류가 발생했습니다."
          noindex={true}
        />
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
        <Footer />
      </div>
    );
  }

  // 동적 메타데이터 생성
  const metadata = generatePageMetadata("health-questions", {
    title:
      questions.length > 0
        ? `건강 질문 - ${questions.length}개의 질문이 있습니다`
        : undefined,
    description:
      questions.length > 0
        ? `${questions.length}개의 건강 질문을 통해 나의 건강 상태를 확인해보세요.`
        : undefined,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={metadata.title}
        description={metadata.description}
        keywords={metadata.keywords}
        ogTitle={metadata.ogTitle}
        ogDescription={metadata.ogDescription}
        ogUrl={`${siteUrl}/health-questions/list`}
        canonical={`${siteUrl}/health-questions/list`}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">건강 질문</h1>
          <p className="text-gray-600">
            다양한 건강 관련 질문을 통해 자신의 건강 상태를 확인해보세요.
          </p>
        </div>

        {/* 질문 목록 */}
        <div className="space-y-3 mb-8">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="text-center py-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2">
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

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
