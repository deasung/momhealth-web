import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PopularQuestions from "./components/PopularQuestions";
import RecommendedQuestions from "./components/RecommendedQuestions";
import CommunityPosts from "./components/CommunityPosts";
import ReloadButton from "./components/ReloadButton";
import { getHomeDataServer } from "../lib/api-server";
import type { HomeData } from "./types/home";
import type { QuestionCardDTO } from "./types/dto";
import { generatePageMetadata } from "../lib/metadata";
import { logger } from "@/lib/logger";

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
    logger.error("홈 데이터 로딩 실패:", err);
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

  // ✅ RSC Payload 최적화: DTO 패턴 적용 - 필요한 필드만 추출
  const popularQuestionsDTO: QuestionCardDTO[] =
    homeData?.popularQuestions.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      thumbnailUrl: q.thumbnailUrl,
      durationMinutes: q.durationMinutes,
      createdAt: q.createdAt,
    })) || [];

  const recommendedQuestionsDTO: QuestionCardDTO[] =
    homeData?.recommendedQuestions.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      thumbnailUrl: q.thumbnailUrl,
      durationMinutes: q.durationMinutes,
      createdAt: q.createdAt,
    })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* ✅ SEO & UX: 히어로 섹션 - h1 태그 */}
        <section className="text-center mb-10 md:mb-12 lg:mb-16">
          {/* <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            오늘의 건강
          </h1> */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 md:mb-10 lg:mb-12 leading-relaxed">
            당신의 건강을 위한 맞춤형 건강 관리 플랫폼
          </p>


        </section>

        {/* ✅ 에러 상태 */}
        {error && (
          <div className="max-w-md mx-auto text-center py-12 md:py-16 mb-12">
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8 sm:p-10">
              <div
                className="text-red-500 text-5xl sm:text-6xl mb-4"
                role="img"
                aria-label="경고"
              >
                ⚠️
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                데이터를 불러올 수 없습니다
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-6">{error}</p>
              <ReloadButton />
            </div>
          </div>
        )}

        {/* ✅ SEO: 시맨틱 HTML 구조 */}
        {/* 인기 질문 섹션 */}
        {popularQuestionsDTO.length > 0 && (
          <section aria-label="인기 건강 질문" className="mb-12 md:mb-16">
            <PopularQuestions questions={popularQuestionsDTO} />
          </section>
        )}

        {/* 추천 질문 섹션 */}
        {recommendedQuestionsDTO.length > 0 && (
          <section aria-label="추천 건강 질문" className="mb-12 md:mb-16">
            <RecommendedQuestions questions={recommendedQuestionsDTO} />
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
          !homeData.popularQuestions?.length &&
          !homeData.recommendedQuestions?.length &&
          !homeData.communityPosts?.length && (
            <div className="text-center py-12 md:py-16">
              <div
                className="text-gray-400 text-5xl sm:text-6xl mb-4"
                role="img"
                aria-label="콘텐츠 없음"
              >
                📋
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                콘텐츠를 준비 중입니다
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                곧 새로운 콘텐츠가 제공될 예정입니다.
              </p>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}
