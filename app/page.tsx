"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SEO from "./components/SEO";
import PopularQuestions from "./components/PopularQuestions";
import RecommendedQuestions from "./components/RecommendedQuestions";
import CommunityPosts from "./components/CommunityPosts";
import { getHomeData } from "../lib/api";
import { HomeData } from "./types/home";
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
        setError(null); // ✅ UX: 재시도 시 이전 에러 초기화

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

  // ✅ 성능: 메타데이터 메모이제이션
  const metadata = useMemo(() => {
    return generatePageMetadata("home", {
      title: homeData
        ? `오늘의 건강 - ${homeData.popularQuestions.length}개 인기 질문, ${homeData.communityPosts.length}개 커뮤니티 게시글`
        : undefined,
      description: homeData
        ? `인기 질문 ${homeData.popularQuestions.length}개, 추천 질문 ${homeData.recommendedQuestions.length}개, 커뮤니티 게시글 ${homeData.communityPosts.length}개가 있는 건강 관리 플랫폼입니다.`
        : undefined,
    });
  }, [homeData]);

  // ✅ UX: 통계 데이터 메모이제이션
  const stats = useMemo(() => {
    if (!homeData) return null;
    return {
      popular: homeData.popularQuestions.length,
      recommended: homeData.recommendedQuestions.length,
      community: homeData.communityPosts.length,
    };
  }, [homeData]);

  // ✅ UX: 스켈레톤 UI 컴포넌트
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

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
        <main className="container mx-auto px-4 py-8 md:py-16">
          {/* ✅ UX: 스켈레톤 UI로 개선 */}
          <div className="max-w-6xl mx-auto">
            {/* 히어로 섹션 스켈레톤 */}
            <div className="text-center mb-12">
              <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-96 mx-auto mb-8 animate-pulse"></div>

              {/* ✅ 반응형: 모바일에서도 통계 카드 표시 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center"
                  >
                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* 섹션 스켈레톤 */}
            <div className="space-y-12">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
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
          title="홈 오류"
          description="홈페이지에서 오류가 발생했습니다."
          noindex={true}
        />
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            {/* ✅ UX: 에러 상태 개선 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-6">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                데이터를 불러올 수 없습니다
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  새로고침
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    // 재시도 로직
                    if (isTokenSynced) {
                      getHomeData()
                        .then(setHomeData)
                        .catch(() =>
                          setError("데이터를 불러오는데 실패했습니다.")
                        )
                        .finally(() => setLoading(false));
                    }
                  }}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* ✅ SEO & UX: 히어로 섹션 개선 - h1 태그 복원 */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            오늘의 건강
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed">
            당신의 건강을 위한 맞춤형 건강 관리 플랫폼
          </p>

          {/* ✅ 반응형 & 디자인: 통계 카드 개선 - 모바일에서도 표시 */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-12 md:mb-16">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 sm:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
                  {stats.popular}
                </div>
                <div className="text-sm sm:text-base text-gray-700 font-medium">
                  인기 질문
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 sm:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                  {stats.recommended}
                </div>
                <div className="text-sm sm:text-base text-gray-700 font-medium">
                  추천 질문
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 sm:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">
                  {stats.community}
                </div>
                <div className="text-sm sm:text-base text-gray-700 font-medium">
                  커뮤니티 게시글
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ✅ SEO: 시맨틱 HTML 구조 개선 */}
        {/* 인기 질문 섹션 */}
        {homeData?.popularQuestions && homeData.popularQuestions.length > 0 && (
          <section aria-label="인기 건강 질문" className="mb-12 md:mb-16">
            <PopularQuestions questions={homeData.popularQuestions} />
          </section>
        )}

        {/* 추천 질문 섹션 */}
        {homeData?.recommendedQuestions &&
          homeData.recommendedQuestions.length > 0 && (
            <section aria-label="추천 건강 질문" className="mb-12 md:mb-16">
              <RecommendedQuestions questions={homeData.recommendedQuestions} />
            </section>
          )}

        {/* 커뮤니티 섹션 */}
        {homeData?.communityPosts && homeData.communityPosts.length > 0 && (
          <section aria-label="커뮤니티 게시글" className="mb-12 md:mb-16">
            <CommunityPosts posts={homeData.communityPosts} />
          </section>
        )}

        {/* ✅ UX: 빈 상태 처리 */}
        {homeData &&
          (!homeData.popularQuestions?.length ||
            !homeData.recommendedQuestions?.length ||
            !homeData.communityPosts?.length) && (
            <div className="text-center py-12 text-gray-500">
              <p>콘텐츠를 준비 중입니다.</p>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}
