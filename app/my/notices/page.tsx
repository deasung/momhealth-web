import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getNoticesServer } from "../../../lib/api-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 메타데이터
export const metadata: Metadata = {
  title: "공지사항",
  description: "서비스 소식을 알립니다.",
  openGraph: {
    title: "공지사항 - 오늘의 건강",
    description: "서비스 소식을 알립니다.",
    url: `${siteUrl}/my/notices`,
  },
  alternates: {
    canonical: `${siteUrl}/my/notices`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface NoticeResponse {
  items: Notice[];
  pagination: PaginationInfo;
}

// 날짜 포맷팅 함수
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// ✅ Server Component: 서버에서 데이터 가져오기
export default async function NoticesPage() {
  let notices: Notice[] = [];
  let error: string | null = null;

  try {
    const response: NoticeResponse = await getNoticesServer({
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    notices = response.items || [];
  } catch (e) {
    error = "공지사항을 불러올 수 없습니다.";
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="공지사항"
        description="서비스 소식을 알립니다."
        noindex={true}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* ✅ UX & 반응형: 페이지 헤더 개선 */}
        <header className="mb-6 md:mb-8">
          <Link
            href="/my"
            className="inline-flex items-center gap-2 px-3 py-2 -ml-3 mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm md:text-base"
            aria-label="마이페이지로 돌아가기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>뒤로가기</span>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              공지사항
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              서비스 소식과 업데이트를 확인하세요
            </p>
          </div>
        </header>

        {/* ✅ SEO & 디자인: 공지사항 목록 */}
        <section aria-label="공지사항 목록">
          {error ? (
            <div
              className="bg-white rounded-lg shadow-sm border-2 border-red-100 p-8 md:p-12 text-center"
              aria-live="polite"
            >
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📢</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                공지사항이 없습니다
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                아직 등록된 공지사항이 없습니다.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-200" role="list">
                {notices.map((notice, index) => {
                  const formattedDate = formatDate(notice.createdAt);
                  const formattedTime = formatTime(notice.createdAt);
                  const isNew =
                    new Date(notice.createdAt).getTime() >
                    Date.now() - 7 * 24 * 60 * 60 * 1000; // 7일 이내

                  return (
                    <li key={notice.id}>
                      <Link
                        href={`/my/notice-detail?id=${notice.id}`}
                        className={`block p-4 md:p-6 hover:bg-gray-50 transition-colors group ${
                          index === 0 ? "border-t-0" : ""
                        }`}
                        aria-label={`${notice.title} - ${formattedDate} ${formattedTime}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-base md:text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
                                {notice.title}
                              </h3>
                              {isNew && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0"
                                  aria-label="새 공지사항"
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                            <time
                              dateTime={notice.createdAt}
                              className="text-xs md:text-sm text-gray-500"
                            >
                              {formattedDate} {formattedTime}
                            </time>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-orange-500 transition-colors mt-1"
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
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
