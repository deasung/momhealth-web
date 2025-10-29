import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { getInquiryDetail } from "../../lib/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { useTokenSync } from "../../lib/hooks/useTokenSync";

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

// 문의 상세 응답 타입 정의
interface InquiryDetailResponse {
  data: {
    inquiry: InquiryDetail;
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

export default function InquiryDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isLoading } = useAuth();
  const { isTokenSynced } = useTokenSync();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 문의 상세 정보 가져오기
  const fetchInquiryDetail = useCallback(async () => {
    if (!id || !isAuthenticated || isLoading || !isTokenSynced) return;

    try {
      setLoading(true);
      setError(null);
      const response: InquiryDetailResponse = await getInquiryDetail(
        Number(id)
      );
      setInquiry(response.data.inquiry);
    } catch (err) {
      setError("문의 내용을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, isLoading, isTokenSynced]);

  useEffect(() => {
    if (isAuthenticated && !isLoading && isTokenSynced && id) {
      fetchInquiryDetail();
    }
  }, [isAuthenticated, isLoading, isTokenSynced, id, fetchInquiryDetail]);

  // 로그인 확인
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="1:1 문의 상세"
          description="문의 내용을 확인하려면 로그인이 필요합니다."
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
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

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="1:1 문의 상세"
          description="문의 내용을 불러오는 중입니다."
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">문의 내용을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 에러 화면
  if (error || !inquiry) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="문의 오류"
          description="문의를 찾을 수 없습니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              문의를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "존재하지 않는 문의입니다."}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              뒤로가기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayStatus = mapInquiryStatus(inquiry.status);
  const isAnswered = displayStatus === "답변완료";

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${inquiry.title} - 1:1 문의`}
        description={
          inquiry.content.length > 150
            ? inquiry.content.substring(0, 150) + "..."
            : inquiry.content
        }
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
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

        {/* 제목 및 메타 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-relaxed">
            {inquiry.title}
          </h1>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {isAnswered ? (
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
              ) : (
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              )}
              <span
                className={`font-medium ${
                  isAnswered ? "text-green-600" : "text-orange-600"
                }`}
              >
                {displayStatus}
              </span>
            </div>
            <span className="text-gray-500">
              {formatDate(inquiry.createdAt)}
            </span>
          </div>
        </div>

        {/* 질문 내용 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-gray-900">Q.</span>
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                {inquiry.content}
              </p>
            </div>
          </div>
        </div>

        {/* 답변 내용 (답변완료인 경우에만 표시) */}
        {isAnswered && inquiry.replyContent && (
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-orange-600">A.</span>
              </div>
              <div className="flex-1">
                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
                  {inquiry.replyContent}
                </p>
                {inquiry.repliedAt && (
                  <p className="text-sm text-gray-500 font-medium">
                    답변일: {formatDate(inquiry.repliedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 답변 대기 중인 경우 안내 메시지 */}
        {!isAnswered && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-blue-800 font-medium">
                답변을 준비 중입니다. 빠른 시일 내에 답변드리겠습니다.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
