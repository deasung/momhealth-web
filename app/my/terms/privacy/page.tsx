"use client";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SEO from "../../../components/SEO";
import { useEffect, useState, useCallback } from "react";
import { getPrivacyPolicy } from "../../../../lib/api";

interface PolicyData {
  title: string;
  content: string;
}

export default function PrivacyPolicyPage() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPrivacyPolicy();
      // 백엔드 응답에서 실제 데이터 필드를 추출 (response.data 형태 가정)
      setPolicy(res?.data ?? res);
    } catch (e) {
      setError("약관을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="개인정보 처리방침"
        description="오늘의 건강 개인정보 처리방침을 확인하실 수 있습니다."
        keywords="개인정보 처리방침, 개인정보보호, 프라이버시"
      />

      <Header />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          개인정보 처리방침
        </h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">약관을 불러오는 중...</p>
          </div>
        ) : error || !policy ? (
          <div className="text-center py-16">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-4">
              {error || "약관을 불러올 수 없습니다."}
            </p>
            <button
              onClick={fetchPolicy}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <article className="prose max-w-none prose-p:leading-7 prose-headings:scroll-mt-20">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              {policy.title}
            </h2>
            {/* 백엔드에서 content가 HTML인지 텍스트인지에 따라 처리 */}
            {typeof policy.content === "string" ? (
              <div className="whitespace-pre-wrap text-gray-800">
                {policy.content}
              </div>
            ) : (
              <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                {JSON.stringify(policy.content, null, 2)}
              </pre>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
