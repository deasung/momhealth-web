import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/Header";
import { getHealthQuestionDetail } from "../../lib/api";
import type { HealthQuestionDetail } from "../../types/health-questions";

const HealthQuestionDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [question, setQuestion] = useState<HealthQuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuestionDetail();
    }
  }, [id]);

  const fetchQuestionDetail = async () => {
    try {
      setLoading(true);
      const data = await getHealthQuestionDetail(id as string);
      setQuestion(data);
    } catch (err) {
      console.error("질문 상세 정보 로딩 실패:", err);
      setError("질문 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuestion = () => {
    if (question?.id) {
      router.push(`/health-questions/${question.id}/quiz`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">질문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "질문을 찾을 수 없습니다."}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{question.title} - 건강질문</title>
        <meta name="description" content={question.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 공통 헤더 */}
        <Header />

        <div className="max-w-4xl mx-auto px-4 py-6">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {question.title}
          </h2>

          {/* 메타 정보 */}
          <div className="flex items-center text-gray-600 mb-6">
            <span className="mr-4">총 {question.questionCount}문항</span>
            <span>소요시간 {question.durationSeconds}초</span>
          </div>

          {/* 썸네일 이미지 */}
          <div className="mb-8">
            <img
              src={question.detailThumbnailUrl || question.thumbnailUrl}
              alt={question.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
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
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              질문 미리보기
            </h3>
            <div className="space-y-3">
              {question.items.slice(0, 3).map((item, index) => (
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

          {/* 시작 버튼 */}
          <div className="text-center">
            <button
              onClick={handleStartQuestion}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg"
            >
              질문 시작하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HealthQuestionDetail;
