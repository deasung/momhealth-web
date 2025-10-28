import Head from "next/head";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

export default function TermsIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>약관 및 정책 | 오늘의 건강</title>
        <meta
          name="description"
          content="서비스 이용약관 및 개인정보 처리방침"
        />
      </Head>

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
