import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 메타데이터
export const metadata: Metadata = {
  title: "약관 및 정책",
  description: "서비스 이용약관 및 개인정보 처리방침을 확인하실 수 있습니다.",
  keywords: "서비스 이용약관, 개인정보 처리방침, 약관, 정책",
  openGraph: {
    title: "약관 및 정책 - 오늘의 건강",
    description: "서비스 이용약관 및 개인정보 처리방침을 확인하실 수 있습니다.",
    url: `${siteUrl}/my/terms`,
  },
  alternates: {
    canonical: `${siteUrl}/my/terms`,
  },
};

// ✅ Server Component: 정적 페이지
export default function TermsIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* ✅ UX & 반응형: 페이지 헤더 개선 */}
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            약관 및 정책
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            서비스 이용약관과 개인정보 처리방침을 확인하실 수 있어요.
          </p>
        </header>

        {/* ✅ SEO & 디자인: 약관 목록 개선 */}
        <nav aria-label="약관 및 정책 메뉴">
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-200" role="list">
              <li>
                <Link
                  href="/my/terms/service"
                  className="flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors group"
                  aria-label="서비스 이용약관 보기"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-base md:text-lg text-gray-900 font-medium group-hover:text-blue-600 transition-colors block">
                        서비스 이용약관
                      </span>
                      <span className="text-xs md:text-sm text-gray-500 mt-0.5 block">
                        서비스 이용에 관한 약관을 확인하세요
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </li>

              <li>
                <Link
                  href="/my/terms/privacy"
                  className="flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors group"
                  aria-label="개인정보 처리방침 보기"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-base md:text-lg text-gray-900 font-medium group-hover:text-green-600 transition-colors block">
                        개인정보 처리방침
                      </span>
                      <span className="text-xs md:text-sm text-gray-500 mt-0.5 block">
                        개인정보 수집 및 이용에 관한 정책을 확인하세요
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-green-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* ✅ UX: 추가 안내 */}
        <div className="mt-6 md:mt-8 p-4 md:p-5 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm md:text-base text-blue-900 font-medium mb-1">
                약관 및 정책 안내
              </p>
              <p className="text-xs md:text-sm text-blue-700 leading-relaxed">
                서비스 이용 전 약관과 개인정보 처리방침을 꼭 확인해주세요.
                약관이 변경될 경우 사전에 공지드립니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
