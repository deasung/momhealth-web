import Head from "next/head";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PopularQuestions from "../components/PopularQuestions";
import RecommendedQuestions from "../components/RecommendedQuestions";
import CommunityPosts from "../components/CommunityPosts";
import { getHomeData } from "../lib/api";
import { HomeData } from "../types/home";
import { useTokenSync } from "../lib/hooks/useTokenSync";

export default function Home() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NextAuth 세션과 localStorage 토큰 동기화
  const { isTokenSynced } = useTokenSync();

  useEffect(() => {
    // 토큰 동기화가 완료된 후에만 API 요청
    if (!isTokenSynced) return;

    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // 토큰은 인터셉터에서 자동으로 처리되므로 getHomeData 호출만 하면 됨
        const data = await getHomeData();
        setHomeData(data);
      } catch (err) {
        console.error("홈 데이터 로딩 실패:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [isTokenSynced]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>오늘의 건강</title>
          <meta name="description" content="오늘의 건강 웹 애플리케이션" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </main>

        {/* 푸터 */}
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>오늘의 건강</title>
          <meta name="description" content="오늘의 건강" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-lg text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </main>

        {/* 푸터 */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>오늘의 건강</title>
        <meta name="description" content="오늘의 건강 웹 애플리케이션" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 히어로 섹션 */}
        <div className="text-center mb-12">
          {/* <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            오늘의 건강
          </h1> */}
          <p className="text-lg text-gray-600 mb-8">
            당신의 건강을 위한 맞춤형 건강 관리 플랫폼
          </p>

          {/* 통계 카드 - 데스크톱에서만 표시 */}
          <div className="hidden md:grid grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {homeData?.popularQuestions.length || 0}
              </div>
              <div className="text-gray-600">인기 질문</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {homeData?.recommendedQuestions.length || 0}
              </div>
              <div className="text-gray-600">추천 질문</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {homeData?.communityPosts.length || 0}
              </div>
              <div className="text-gray-600">커뮤니티 게시글</div>
            </div>
          </div>
        </div>

        {/* 인기 질문 섹션 */}
        {homeData?.popularQuestions && homeData.popularQuestions.length > 0 && (
          <PopularQuestions questions={homeData.popularQuestions} />
        )}

        {/* 추천 질문 섹션 */}
        {homeData?.recommendedQuestions &&
          homeData.recommendedQuestions.length > 0 && (
            <RecommendedQuestions questions={homeData.recommendedQuestions} />
          )}

        {/* 커뮤니티 섹션 */}
        {homeData?.communityPosts && homeData.communityPosts.length > 0 && (
          <CommunityPosts posts={homeData.communityPosts} />
        )}
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
