import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PopularQuestions from "./components/PopularQuestions";
import RecommendedQuestions from "./components/RecommendedQuestions";
import CommunityPosts from "./components/CommunityPosts";
import { getHomeDataServer } from "../lib/api-server";
import { HomeData } from "./types/home";
import { generatePageMetadata } from "../lib/metadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 동적 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
  try {
    const homeData = await getHomeDataServer();
    const metadata = generatePageMetadata("home", {
      title: `오늘의 건강 - ${homeData.popularQuestions.length}개 인기 질문, ${homeData.communityPosts.length}개 커뮤니티 게시글`,
      description: `인기 질문 ${homeData.popularQuestions.length}개, 추천 질문 ${homeData.recommendedQuestions.length}개, 커뮤니티 게시글 ${homeData.communityPosts.length}개가 있는 건강 관리 플랫폼입니다.`,
    });

    return {
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
      openGraph: {
        title: metadata.ogTitle || metadata.title,
        description: metadata.ogDescription || metadata.description,
        images: [
          {
            url: `${siteUrl}/og-image.png`,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: "오늘의 건강 - 건강한 하루를 위한 맞춤형 건강 관리 서비스",
          },
        ],
        url: siteUrl,
      },
      twitter: {
        card: "summary_large_image",
        title: metadata.ogTitle || metadata.title,
        description: metadata.ogDescription || metadata.description,
        images: [`${siteUrl}/og-image.png`],
      },
    };
  } catch (error) {
    // 에러 발생 시 기본 메타데이터 반환
    return {
      title: "오늘의 건강",
      description:
        "건강한 하루를 위한 맞춤형 건강 관리 서비스입니다. 건강 질문, 커뮤니티, 친구와의 건강 공유를 통해 더 나은 건강을 만들어보세요.",
    };
  }
}

// ✅ Server Component: 서버에서 데이터 가져오기
export default async function Home() {
  let homeData: HomeData | null = null;
  let error: string | null = null;

  try {
    // 서버에서 데이터 가져오기
    homeData = await getHomeDataServer();
  } catch (err) {
    console.error("홈 데이터 로딩 실패:", err);
    error = "데이터를 불러오는데 실패했습니다.";
  }

  // 통계 데이터 계산
  const stats = homeData
    ? {
        popular: homeData.popularQuestions.length,
        recommended: homeData.recommendedQuestions.length,
        community: homeData.communityPosts.length,
      }
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* ✅ SEO & UX: 히어로 섹션 - h1 태그 */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            오늘의 건강
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed">
            당신의 건강을 위한 맞춤형 건강 관리 플랫폼
          </p>

          {/* ✅ 반응형 & 디자인: 통계 카드 */}
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

        {/* ✅ 에러 상태 */}
        {error && (
          <div className="max-w-md mx-auto text-center mb-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                데이터를 불러올 수 없습니다
              </h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        )}

        {/* ✅ SEO: 시맨틱 HTML 구조 */}
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

        {/* ✅ 빈 상태 처리 */}
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
