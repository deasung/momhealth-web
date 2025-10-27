import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../lib/hooks/useAuth";

export default function AddFriendPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>친구 추가 - 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            로그인이 필요합니다
          </h2>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    // TODO: 친구 검색 API 호출
    setTimeout(() => {
      setLoading(false);
      alert("친구 검색 기능은 준비 중입니다.");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>친구 추가 - 오늘의 건강</title>
      </Head>

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
          <h1 className="text-3xl font-bold text-gray-900">친구 추가</h1>
          <p className="text-gray-600 mt-2">
            이메일로 친구를 검색하고 초대하세요.
          </p>
        </div>

        {/* 검색 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "검색"
              )}
            </button>
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            친구를 검색하세요
          </h3>
          <p className="text-gray-600">
            이메일 주소를 입력하고 검색 버튼을 눌러주세요.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
