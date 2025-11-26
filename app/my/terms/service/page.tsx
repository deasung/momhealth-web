import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getServiceTermsServer } from "../../../../lib/api-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 메타데이터
export const metadata: Metadata = {
  title: "서비스 이용약관",
  description: "오늘의 건강 서비스 이용약관을 확인하실 수 있습니다.",
  keywords: "서비스 이용약관, 이용약관, 약관",
  openGraph: {
    title: "서비스 이용약관 - 오늘의 건강",
    description: "오늘의 건강 서비스 이용약관을 확인하실 수 있습니다.",
    url: `${siteUrl}/my/terms/service`,
  },
  alternates: {
    canonical: `${siteUrl}/my/terms/service`,
  },
};

interface PolicyData {
  title: string;
  content: string;
}

// ✅ Server Component: 서버에서 데이터 가져오기
export default async function ServiceTermsPage() {
  let policy: PolicyData | null = null;
  let error: string | null = null;

  try {
    const res = await getServiceTermsServer();
    policy = res?.data ?? res;
  } catch (e) {
    console.error("약관 로딩 실패:", e);
    error = "약관을 불러올 수 없습니다.";
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          서비스 이용약관
        </h1>

        {error || !policy ? (
          <div className="text-center py-16">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-4">
              {error || "약관을 불러올 수 없습니다."}
            </p>
          </div>
        ) : (
          <article className="prose max-w-none">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              {policy.title}
            </h2>
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
