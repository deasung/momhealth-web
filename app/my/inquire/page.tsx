"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getInquiries } from "../../../lib/api";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useTokenSync } from "../../../lib/hooks/useTokenSync";

// 문의 상태 타입 정의
type InquiryStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

// 문의 아이템 타입 정의
interface Inquiry {
  id: string;
  title: string;
  status: InquiryStatus;
  createdAt: string;
}

// 문의 목록 응답 타입 정의
interface InquiryListResponse {
  data: {
    inquiries: Inquiry[];
  };
  pagination?: {
    nextCursor?: string;
    hasNextPage?: boolean;
  };
}

// 상태 매핑 함수
const mapInquiryStatus = (status: InquiryStatus): "답변대기" | "답변완료" => {
  switch (status) {
    case "PENDING":
    case "IN_PROGRESS":
      return "답변대기";
    case "COMPLETED":
      return "답변완료";
    default:
      return "답변대기";
  }
};

// 날짜 포맷팅 함수
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

export default function InquirePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { isTokenSynced } = useTokenSync();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 문의 목록 가져오기
  const fetchInquiries = useCallback(
    async (isRefresh: boolean = false) => {
      if (!isAuthenticated || isLoading || !isTokenSynced) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response: InquiryListResponse = await getInquiries({
          limit: 10,
          cursor: isRefresh ? undefined : nextCursor || undefined,
        });

        if (isRefresh || !nextCursor) {
          setInquiries(response.data.inquiries);
        } else {
          setInquiries((prev) => [...prev, ...response.data.inquiries]);
        }

        setNextCursor(response.pagination?.nextCursor || null);
        setHasMore(response.pagination?.hasNextPage || false);
      } catch (err) {
        setError("문의 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, isLoading, isTokenSynced, nextCursor]
  );

  // 다음 페이지 로드
  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchInquiries();
    }
  };

  // 초기 로드
  useEffect(() => {
    if (isAuthenticated && !isLoading && isTokenSynced) {
      fetchInquiries();
    }
  }, [isAuthenticated, isLoading, isTokenSynced, fetchInquiries]);

  // 로그인 확인
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="1:1 문의"
          description="궁금한 내용이 있으신가요? 1:1 문의를 남겨주세요."
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="mb-8">
            <div className="text-gray-400 text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-8">
              1:1 문의를 이용하려면 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              로그인하기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 로딩 화면
  if (loading && inquiries.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <SEO title="1:1 문의" description="문의 목록을 불러오는 중입니다." />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">문의 목록을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="1:1 문의 오류"
          description="문의 목록을 불러올 수 없습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              다시 시도
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
        title="1:1 문의"
        description="궁금한 내용이 있으신가요? 1:1 문의를 남겨주세요."
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 타이틀 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">1:1 문의</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            뒤로가기
          </button>
        </div>

        {/* 1:1 문의 배너 - 문의 목록이 있을 때만 표시 */}
        {inquiries.length > 0 && (
          <div className="bg-orange-50 rounded-lg p-6 mb-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-900 font-medium mb-2">
                  궁금한 내용이 있으신가요?
                </p>
                <p className="text-gray-600 text-sm">1:1 문의를 남겨주세요</p>
              </div>
              <Link
                href="/my/inquire-write"
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                1:1 문의하기
              </Link>
            </div>
          </div>
        )}

        {/* 문의 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {inquiries.length === 0 ? (
            // 빈 상태
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                아직 문의가 없습니다
              </h3>
              <p className="text-gray-600 mb-8">
                궁금한 내용이 있으시면 1:1 문의를 남겨주세요.
              </p>
              <Link
                href="/my/inquire-write"
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                1:1 문의하기
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {inquiries.map((inquiry, index) => {
                const displayStatus = mapInquiryStatus(inquiry.status);
                const isLast = index === inquiries.length - 1;

                return (
                  <div
                    key={inquiry.id}
                    className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !isLast ? "border-b border-gray-100" : ""
                    }`}
                    onClick={() =>
                      router.push(`/my/inquire-detail?id=${inquiry.id}`)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {inquiry.title}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {displayStatus === "답변대기" ? (
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            ) : (
                              <svg
                                className="w-3 h-3 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            <span
                              className={`text-sm font-medium ${
                                displayStatus === "답변대기"
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {displayStatus}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(inquiry.createdAt)}
                          </span>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 더보기 버튼 */}
          {hasMore && inquiries.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={loadMore}
                disabled={loading || refreshing}
                className="w-full py-3 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || refreshing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                    <span>로딩 중...</span>
                  </div>
                ) : (
                  "더보기"
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
