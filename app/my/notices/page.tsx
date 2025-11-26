"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getNotices } from "../../../lib/api";

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

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [hasMore, setHasMore] = useState(true);

  // 공지사항 목록 가져오기
  const fetchNotices = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const response: NoticeResponse = await getNotices({
        page,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const { items, pagination: paginationInfo } = response;

      if (page === 1 || isRefresh) {
        setNotices(items);
      } else {
        setNotices((prev) => [...prev, ...items]);
      }

      setPagination(paginationInfo);
      setHasMore(page < paginationInfo.totalPages);
    } catch (error) {
      setNotices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 다음 페이지 로드
  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchNotices(pagination.currentPage + 1);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchNotices();
  }, []);

  const handleNoticeClick = (noticeId: string) => {
    router.push(`/my/notice-detail?id=${noticeId}`);
  };

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

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="공지사항"
        description="서비스 소식을 알립니다."
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
          <h1 className="text-3xl font-bold text-gray-900">공지사항</h1>
        </div>

        {/* 공지사항 목록 */}
        {loading && notices.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">공지사항을 불러오는 중...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📢</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              공지사항이 없습니다
            </h3>
            <p className="text-gray-600">아직 등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {notices.map((notice, index) => (
              <div
                key={notice.id}
                className={`bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                  index === 0 ? "rounded-t-lg border-t" : ""
                }`}
              >
                <button
                  onClick={() => handleNoticeClick(notice.id)}
                  className="w-full p-6 flex items-center justify-between gap-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(notice.createdAt)}{" "}
                      {formatTime(notice.createdAt)}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
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
            ))}

            {/* 더보기 버튼 */}
            {hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={loadMore}
                  disabled={loading || refreshing}
                  className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {loading || refreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                      로딩 중...
                    </>
                  ) : (
                    <>
                      더 많은 공지사항 보기
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 더 이상 공지사항이 없을 때 */}
            {!hasMore && notices.length > 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500">모든 공지사항을 확인했습니다.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
