import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../../components/Header";

// 정적 생성에서 제외하고 동적으로 렌더링
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

const ResultPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const handleRetake = () => {
    router.push(`/health-questions/${id}/quiz`);
  };

  const handleBackToList = () => {
    router.push("/health-questions/list");
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>퀴즈 결과</title>
      </Head>

      {/* 공통 헤더 */}
      <Header />

      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        {/* 결과 내용 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-black mb-6">나의 점수</h1>

          {/* 점수 표시 */}
          <div className="text-6xl font-bold text-teal-500 mb-4">25</div>

          {/* 피드백 태그 */}
          <div className="inline-flex items-center bg-teal-50 text-teal-700 px-4 py-2 rounded-full mb-6">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            뛰어난 스트레스 관리
          </div>

          {/* 설명 텍스트 */}
          <div className="text-black text-lg leading-relaxed">
            <p className="mb-2">
              스트레스를 잘 관리하고 있습니다! 현재의 방식 그대로,
            </p>
            <p>스트레스를 효과적으로 대처하고 있는 상태입니다.</p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="w-full max-w-md flex items-center justify-between">
          <button
            onClick={handleRetake}
            className="flex items-center text-black hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            다시 풀기
          </button>

          <button
            onClick={handleBackToList}
            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            목록으로
            <svg
              className="w-5 h-5 ml-2"
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
    </div>
  );
};

export default ResultPage;
