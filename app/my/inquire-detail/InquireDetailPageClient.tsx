"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getInquiryDetail } from "../../../lib/api";

// 문의 상태 타입 정의
type InquiryStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

// 문의 상세 타입 정의
interface InquiryDetail {
  id: string;
  title: string;
  content: string;
  status: InquiryStatus;
  createdAt: string;
  replyContent?: string;
  repliedAt?: string;
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

export default function InquireDetailPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && id) {
        const fetchInquiryDetail = async () => {
          try {
            setLoading(true);
            const response = await getInquiryDetail(Number(id));
            setInquiry(response.data.inquiry);
          } catch (e) {
            setError("문의 내용을 불러올 수 없습니다.");
          } finally {
            setLoading(false);
          }
        };
        fetchInquiryDetail();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="문의 상세" description="문의 내용을 불러오는 중입니다." noindex={true} />
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="1:1 문의 상세" description="문의 내용을 확인하려면 로그인이 필요합니다." noindex={true} />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center">
          <div className="mb-8">
            <div className="text-gray-400 text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-8">
              문의 내용을 확인하려면 로그인해주세요.
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

  if (error || !inquiry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="문의 오류" description="문의를 찾을 수 없습니다." noindex={true} />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            문의를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "존재하지 않거나 접근 권한이 없는 문의입니다."}
          </p>
          <Link
            href="/my/inquire"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            aria-label="문의 목록으로 돌아가기"
          >
            목록으로 돌아가기
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const displayStatus = mapInquiryStatus(inquiry.status);
  const isAnswered = displayStatus === "답변완료";
  const formattedCreatedAt = formatDate(inquiry.createdAt);
  const formattedRepliedAt = inquiry.repliedAt
    ? formatDate(inquiry.repliedAt)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${inquiry.title} - 1:1 문의`}
        description={
          inquiry.content.length > 150
            ? inquiry.content.substring(0, 150) + "..."
            : inquiry.content
        }
        noindex={true}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section className="mb-8 md:mb-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                1:1 문의 상세
              </h1>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                문의 내용과 답변을 확인하세요
              </p>
            </div>
            <Link
              href="/my/inquire"
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm md:text-base"
              aria-label="문의 목록으로 돌아가기"
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

        <article className="space-y-4 md:space-y-6">
          <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed flex-1">
                {inquiry.title}
              </h1>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isAnswered
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-orange-50 text-orange-700 border border-orange-200"
                }`}
              >
                {isAnswered ? (
                  <svg
                    className="w-4 h-4"
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
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <time dateTime={inquiry.createdAt}>{formattedCreatedAt}</time>
            </div>
          </header>

          <section
            className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-4 md:p-6"
            aria-labelledby="question-heading"
          >
            <h2 id="question-heading" className="sr-only">
              질문 내용
            </h2>
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg md:text-xl">
                  Q
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base md:text-lg text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {inquiry.content}
                </p>
              </div>
            </div>
          </section>

          {isAnswered && inquiry.replyContent && (
            <section
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200 p-4 md:p-6"
              aria-labelledby="answer-heading"
            >
              <h2 id="answer-heading" className="sr-only">
                답변 내용
              </h2>
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-500 text-white font-bold text-lg md:text-xl">
                    A
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base md:text-lg text-gray-800 leading-relaxed whitespace-pre-wrap break-words mb-4">
                    {inquiry.replyContent}
                  </p>
                  {formattedRepliedAt && (
                    <p className="text-sm text-gray-600 font-medium">
                      <time dateTime={inquiry.repliedAt}>
                        답변일: {formattedRepliedAt}
                      </time>
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {!isAnswered && (
            <section
              className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4 md:p-6"
              aria-live="polite"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base text-blue-800 font-medium leading-relaxed">
                    답변을 준비 중입니다. 빠른 시일 내에 답변드리겠습니다.
                  </p>
                  <p className="text-xs md:text-sm text-blue-600 mt-2">
                    일반적으로 1-2일 내에 답변드립니다.
                  </p>
                </div>
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
