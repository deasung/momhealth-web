"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../../components/Header";
import Footer from "../../../../components/Footer";
import SEO from "../../../../components/SEO";
import { getFriendQuestionResult } from "../../../../../lib/api";

interface ResultData {
  score: number;
  riskLevel: string;
  result: {
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    linkUrlName: string;
  };
}

const getScoreColorsAndIcon = (score: number) => {
  let color = "#14161A";
  let tagBg = "#fff";
  let tagBorder = "#e0e0e0";
  let iconEmoji = "🔥";

  // 스코어가 높을경우 좋은색상
  if (score >= 15) {
    color = "#31D3DE";
    tagBg = "#eafbfc";
    tagBorder = "#bff1f5";
    iconEmoji = "✅";
  } else if (score >= 10) {
    color = "#FF9500";
    tagBg = "#fff4e6";
    tagBorder = "#ffce8a";
    iconEmoji = "⚠️";
  } else {
    color = "#FF3B30";
    tagBg = "#ffecec";
    tagBorder = "#ffaaaa";
    iconEmoji = "🔥";
  }

  return { color, tagBg, tagBorder, iconEmoji };
};

export default function FriendQuestionResultPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const userId = params?.userId as string;

  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!id || !userId) {
        setError("필수 파라미터가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await getFriendQuestionResult({
          questionId: id,
          targetUserId: userId,
        });

        setResultData(res);
      } catch (e: any) {
        if (e?.response?.status === 404) {
          setError("결과가 없습니다.");
        } else if (e?.response?.status === 401) {
          setError("로그인이 필요합니다.");
        } else if (e?.response?.status === 403) {
          setError("접근 권한이 없습니다.");
        } else {
          setError("결과를 불러오는데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, userId]);

  const handleLinkPress = () => {
    if (!resultData?.result.linkUrl) return;
    window.open(resultData.result.linkUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="질문 결과"
          description="질문 결과를 불러오는 중입니다."
          noindex={true}
        />
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 py-8 md:py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            결과를 불러오는 중...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="질문 결과" description={error} noindex={true} />
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 py-8 md:py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8 sm:p-10">
              <div
                className="text-red-500 text-5xl sm:text-6xl mb-4"
                role="img"
                aria-label="경고"
              >
                ⚠️
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
              <Link
                href={`/friends/${userId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
                aria-label="친구의 질문 내역으로 돌아가기"
              >
                <span>돌아가기</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="질문 결과"
          description="결과 데이터가 없습니다."
          noindex={true}
        />
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 py-8 md:py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 sm:p-10">
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                결과 데이터가 없습니다.
              </p>
              <Link
                href={`/friends/${userId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
                aria-label="친구의 질문 내역으로 돌아가기"
              >
                <span>돌아가기</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { score, result } = resultData;
  const { color, tagBg, tagBorder, iconEmoji } = getScoreColorsAndIcon(score);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="질문 결과"
        description="친구의 질문 결과를 확인하세요."
        noindex={true}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 뒤로가기 버튼 */}
        <nav aria-label="브레드크럼 네비게이션" className="mb-6">
          <Link
            href={`/friends/${userId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm md:text-base font-medium min-h-[44px]"
            aria-label="친구의 질문 내역으로 돌아가기"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>질문 내역으로</span>
          </Link>
        </nav>

        {/* 결과 카드 */}
        <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* 점수 섹션 */}
            <section className="text-center mb-8">
              <h2 className="text-sm sm:text-base font-bold text-gray-600 mb-4">
                상대방의 점수
              </h2>
              <div
                className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6"
                style={{ color }}
              >
                {score}
              </div>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 mb-6"
                style={{
                  backgroundColor: tagBg,
                  borderColor: tagBorder,
                }}
              >
                <span className="text-2xl">{iconEmoji}</span>
                <span
                  className="text-base sm:text-lg font-bold"
                  style={{ color }}
                >
                  {result.title}
                </span>
              </div>
            </section>

            {/* 이미지 */}
            {result.imageUrl && (
              <div className="mb-8">
                <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                  <Image
                    src={result.imageUrl}
                    alt={result.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                  />
                </div>
              </div>
            )}

            {/* 설명 */}
            <section className="mb-8">
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                {result.description}
              </p>
            </section>

            {/* 링크 */}
            {result.linkUrl && result.linkUrlName && (
              <section className="mt-8">
                <button
                  onClick={handleLinkPress}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left min-h-[48px]"
                  aria-label={`${result.linkUrlName} 링크 열기`}
                >
                  <span className="text-base font-medium text-orange-600">
                    {result.linkUrlName}
                  </span>
                  <svg
                    className="w-5 h-5 text-orange-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </section>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
