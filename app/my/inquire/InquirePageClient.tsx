"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getInquiries } from "../../../lib/api";

// 문의 상태 타입 정의
type InquiryStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

// 문의 아이템 타입 정의
interface Inquiry {
  id: string;
  title: string;
  status: InquiryStatus;
  createdAt: string;
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

export default function InquirePageClient() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        const fetchInquiries = async () => {
          try {
            setLoading(true);
            const response = await getInquiries({ limit: 10 });
            setInquiries(response.data?.inquiries || []);
          } catch (e) {
            setError("문의 목록을 불러오는데 실패했습니다.");
          } finally {
            setLoading(false);
          }
        };
        fetchInquiries();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="1:1 문의"
          description="궁금한 내용이 있으신가요? 1:1 문의를 남겨주세요."
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="1:1 문의"
          description="궁금한 내용이 있으신가요? 1:1 문의를 남겨주세요."
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="1:1 문의"
        description="궁금한 내용이 있으신가요? 1:1 문의를 남겨주세요."
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section className="mb-8 md:mb-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                1:1 문의
              </h1>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                궁금한 내용을 문의해주세요
              </p>
            </div>
            <Link
              href="/my"
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm md:text-base"
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
          </div>
        </section>

        {error ? (
          <section
            className="bg-white rounded-lg shadow-sm border-2 border-red-100 p-8 md:p-12 text-center"
            aria-live="polite"
          >
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/my/inquire"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              aria-label="문의 목록 새로고침"
            >
              다시 시도
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-6">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 md:p-6 border-2 border-orange-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
                      궁금한 내용이 있으신가요?
                    </h2>
                    <p className="text-sm md:text-base text-gray-600">
                      1:1 문의를 남겨주시면 빠르게 답변드립니다
                    </p>
                  </div>
                  <Link
                    href="/my/inquire-write"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm md:text-base whitespace-nowrap"
                    aria-label="새 문의 작성하기"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>문의하기</span>
                  </Link>
                </div>
              </div>
            </section>

            <section aria-label="문의 목록">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {inquiries.length === 0 ? (
                  <div className="text-center py-12 md:py-16 px-4">
                    <div className="text-gray-400 text-6xl mb-4">❓</div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      아직 문의가 없습니다
                    </h3>
                    <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
                      궁금한 내용이 있으시면 1:1 문의를 남겨주세요.
                    </p>
                    <Link
                      href="/my/inquire-write"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      aria-label="첫 문의 작성하기"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>문의하기</span>
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200" role="list">
                    {inquiries.map((inquiry) => {
                      const displayStatus = mapInquiryStatus(inquiry.status);
                      const isAnswered = displayStatus === "답변완료";
                      const formattedDate = formatDate(inquiry.createdAt);

                      return (
                        <li key={inquiry.id}>
                          <Link
                            href={`/my/inquire-detail?id=${inquiry.id}`}
                            className="block p-4 md:p-6 hover:bg-gray-50 transition-colors group"
                            aria-label={`${inquiry.title} - ${displayStatus}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                  {inquiry.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium ${
                                      isAnswered
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-orange-50 text-orange-700 border border-orange-200"
                                    }`}
                                  >
                                    {isAnswered ? (
                                      <svg
                                        className="w-3 h-3 md:w-4 md:h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        aria-hidden="true"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    ) : (
                                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                    )}
                                    <span>{displayStatus}</span>
                                  </div>
                                  <time
                                    dateTime={inquiry.createdAt}
                                    className="text-xs md:text-sm text-gray-500"
                                  >
                                    {formattedDate}
                                  </time>
                                </div>
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
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
