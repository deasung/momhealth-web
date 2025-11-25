"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SEO from "../../../components/SEO";
import { getNoticeDetail } from "../../../lib/api";

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

export default function NoticeDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 공지사항 상세 정보 로드
  useEffect(() => {
    const fetchNoticeDetail = async () => {
      if (!id || typeof id !== "string") return;

      try {
        setLoading(true);
        setError(null);

        const response: NoticeDetailResponse = await getNoticeDetail(id);
        setNotice(response.data);
      } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
          const apiError = error as { response?: { status?: number } };
          if (apiError.response?.status === 404) {
            setError("해당 공지사항을 찾을 수 없습니다.");
          } else {
            setError("공지사항을 불러오는데 실패했습니다.");
          }
        } else {
          setError("공지사항을 불러오는데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNoticeDetail();
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="공지사항"
          description="공지사항을 불러오는 중입니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">공지사항을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
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
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>

        {/* 공지사항 상세 */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* 제목과 작성일 */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {notice.title}
            </h1>
            <p className="text-sm text-gray-500">
              {formatDate(notice.createdAt)}
            </p>
          </div>

          {/* 본문 */}
          <div className="prose prose-lg max-w-none">
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {notice.content}
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
