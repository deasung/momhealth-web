import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";

// ✅ SEO: 메타데이터
export const metadata: Metadata = {
  title: "약관 및 정책",
  description: "서비스 이용약관 및 개인정보 처리방침을 확인하실 수 있습니다.",
  keywords: "서비스 이용약관, 개인정보 처리방침, 약관, 정책",
  openGraph: {
    title: "약관 및 정책 - 오늘의 건강",
    description: "서비스 이용약관 및 개인정보 처리방침을 확인하실 수 있습니다.",
    url: `${siteUrl}/my/terms`,
  },
  alternates: {
    canonical: `${siteUrl}/my/terms`,
  },
};

// ✅ Server Component: 정적 페이지
export default function TermsIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          약관 및 정책
        </h1>
        <p className="text-gray-600 mb-8">
          서비스 이용약관과 개인정보 처리방침을 확인하실 수 있어요.
        </p>

        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <Link
            href="/my/terms/service"
            className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-900 font-medium">서비스 이용약관</span>
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
          </Link>

          <Link
            href="/my/terms/privacy"
            className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-900 font-medium">개인정보 처리방침</span>
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
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
