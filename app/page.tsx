"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import PopularQuestions from "../components/PopularQuestions";
import RecommendedQuestions from "../components/RecommendedQuestions";
import CommunityPosts from "../components/CommunityPosts";
import { getHomeData } from "../lib/api";
import { HomeData } from "../types/home";
import { useTokenSync } from "../lib/hooks/useTokenSync";
import { generatePageMetadata } from "../lib/metadata";

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
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [isTokenSynced]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="홈"
          description="건강한 하루를 위한 맞춤형 건강 관리 서비스입니다. 건강 질문, 커뮤니티, 친구와의 건강 공유를 통해 더 나은 건강을 만들어보세요."
          keywords="건강 관리, 건강 질문, 건강 커뮤니티, 건강 공유"
          ogImage={`${siteUrl}/og-image.png`}
          ogUrl={siteUrl}
        />
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
        <SEO
          title="홈 오류"
          description="홈페이지에서 오류가 발생했습니다."
          noindex={true}
        />
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

  // 홈페이지 메타데이터 생성
  const metadata = generatePageMetadata("home", {
    title: homeData
      ? `오늘의 건강 - ${homeData.popularQuestions.length}개 인기 질문, ${homeData.communityPosts.length}개 커뮤니티 게시글`
      : undefined,
    description: homeData
      ? `인기 질문 ${homeData.popularQuestions.length}개, 추천 질문 ${homeData.recommendedQuestions.length}개, 커뮤니티 게시글 ${homeData.communityPosts.length}개가 있는 건강 관리 플랫폼입니다.`
      : undefined,
  });

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={metadata.title}
        description={metadata.description}
        keywords={metadata.keywords}
        ogTitle={metadata.ogTitle}
        ogDescription={metadata.ogDescription}
        ogImage={`${siteUrl}/og-image.png`}
        ogUrl={siteUrl}
      />

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
