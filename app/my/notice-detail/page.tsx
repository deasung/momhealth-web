import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getNoticeDetailServer } from "../../../lib/api-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NoticeDetailResponse {
  data: Notice;
}

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const dateStr = date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\./g, ".");
  const timeStr = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr} ${timeStr}`;
};

// ✅ SEO: 동적 메타데이터 생성
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { id?: string };
}): Promise<Metadata> {
  const id = searchParams?.id;

  if (!id) {
    return {
      title: "공지사항 오류",
      description: "공지사항을 찾을 수 없습니다.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  try {
    const response: NoticeDetailResponse = await getNoticeDetailServer(id);
    const notice = response.data;

    return {
      title: `${notice.title} - 공지사항`,
      description:
        notice.content.length > 150
          ? notice.content.substring(0, 150) + "..."
          : notice.content,
      openGraph: {
        title: `${notice.title} - 공지사항`,
        description:
          notice.content.length > 150
            ? notice.content.substring(0, 150) + "..."
            : notice.content,
        url: `${siteUrl}/my/notice-detail?id=${id}`,
      },
      alternates: {
        canonical: `${siteUrl}/my/notice-detail?id=${id}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (error) {
    return {
      title: "공지사항 오류",
      description: "공지사항을 찾을 수 없습니다.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// ✅ Server Component: 서버에서 데이터 가져오기
export default async function NoticeDetailPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams?.id;

  if (!id || typeof id !== "string") {
    notFound();
  }

  let notice: Notice | null = null;
  let error: string | null = null;

  try {
    const response: NoticeDetailResponse = await getNoticeDetailServer(id);
    notice = response.data;
  } catch (e: unknown) {
    if (e && typeof e === "object" && "response" in e) {
      const apiError = e as { response?: { status?: number } };
      if (apiError.response?.status === 404) {
        error = "해당 공지사항을 찾을 수 없습니다.";
      } else {
        error = "공지사항을 불러오는데 실패했습니다.";
      }
    } else {
      error = "공지사항을 불러오는데 실패했습니다.";
    }
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="공지사항 오류"
          description="공지사항을 찾을 수 없습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "공지사항을 불러올 수 없습니다."}
            </p>
            <Link
              href="/my/notices"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              aria-label="공지사항 목록으로 돌아가기"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ✅ 성능: 한 번만 계산
  const formattedDate = formatDate(notice.createdAt);
  const isNew =
    new Date(notice.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000; // 7일 이내

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${notice.title} - 공지사항`}
        description={
          notice.content.length > 150
            ? notice.content.substring(0, 150) + "..."
            : notice.content
        }
        noindex={true}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* ✅ UX & 반응형: 뒤로가기 버튼 개선 */}
        <div className="mb-6">
          <Link
            href="/my/notices"
            className="inline-flex items-center gap-2 px-3 py-2 -ml-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm md:text-base"
            aria-label="공지사항 목록으로 돌아가기"
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
        </div>

        {/* ✅ SEO: 의미론적 HTML 구조 */}
        <article className="space-y-4 md:space-y-6">
          {/* ✅ 디자인: 제목 및 메타 정보 카드 */}
          <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-relaxed flex-1">
                {notice.title}
              </h1>
              {isNew && (
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0"
                  aria-label="새 공지사항"
                >
                  NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <time dateTime={notice.createdAt}>{formattedDate}</time>
              {notice.updatedAt !== notice.createdAt && (
                <span className="text-xs text-gray-400">
                  (수정됨: {formatDate(notice.updatedAt).split(" ")[0]})
                </span>
              )}
            </div>
          </header>

          {/* ✅ 디자인: 본문 내용 */}
          <section
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 lg:p-8"
            aria-labelledby="notice-content"
          >
            <h2 id="notice-content" className="sr-only">
              공지사항 내용
            </h2>
            <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
              <p className="text-base md:text-lg text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {notice.content}
              </p>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
