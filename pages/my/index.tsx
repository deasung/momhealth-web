import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../lib/hooks/useAuth";
import { useLogout } from "../../lib/hooks/useLogout";

export default function MyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { logout } = useLogout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // 로그인 확인
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>마이페이지 - 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="mb-8">
            <div className="text-gray-400 text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-8">
              마이페이지를 이용하려면 로그인해주세요.
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
      <Head>
        <title>마이페이지 - 오늘의 건강</title>
      </Head>

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 타이틀 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">마이</h1>

        {/* 사용자 프로필 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-3xl">👤</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                김대성님
              </h2>
              <p className="text-sm text-gray-500">카카오 연동</p>
            </div>
            <Link
              href="/my/settings"
              className="text-gray-400 hover:text-gray-600"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* 내 활동 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">내 활동</h3>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <Link
              href="/health-questions/list"
              className="p-6 text-center hover:bg-gray-50 transition-colors"
            >
              <div className="mb-3">
                <div className="w-12 h-12 mx-auto bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">건강 질문</p>
            </Link>

            <Link
              href="/community/list"
              className="p-6 text-center hover:bg-gray-50 transition-colors"
            >
              <div className="mb-3">
                <div className="w-12 h-12 mx-auto bg-green-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">작성글</p>
            </Link>

            <Link
              href="/my/terms"
              className="p-6 text-center hover:bg-gray-50 transition-colors"
            >
              <div className="mb-3">
                <div className="w-12 h-12 mx-auto bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">약관 및 정책</p>
            </Link>
          </div>
        </div>

        {/* 지원 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">지원</h3>
          </div>
          <div>
            <Link
              href="/support/inquiry"
              className="flex items-center justify-between p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">1:1 문의하기</p>
                  <p className="text-sm text-gray-500">
                    궁금한 점을 문의해주세요.
                  </p>
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
            </Link>

            <Link
              href="/support/notice"
              className="flex items-center justify-between p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3a14.07 14.07 0 01-2.683 2.682M14.282 17H19a2 2 0 002-2v-4.5c0-3-1.995-5.88-5.677-6.09"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">공지사항</p>
                  <p className="text-sm text-gray-500">
                    서비스 소식을 알립니다.
                  </p>
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
            </Link>

            <Link
              href="/my/info"
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">앱 정보</p>
                  <p className="text-sm text-gray-500">버전 정보 및 라이선스</p>
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
            </Link>
          </div>
        </div>

        {/* 내 계정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">내 계정</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <button
              onClick={() => {
                if (confirm("정말 탈퇴하시겠습니까?")) {
                  // 탈퇴 로직 (추후 구현)
                  alert("회원 탈퇴 기능은 준비 중입니다.");
                }
              }}
              className="p-6 text-center hover:bg-gray-50 transition-colors text-red-600"
            >
              <p className="font-medium">회원 탈퇴</p>
            </button>
            <button
              onClick={() => {
                if (confirm("로그아웃 하시겠습니까?")) {
                  handleLogout();
                }
              }}
              className="p-6 text-center hover:bg-gray-50 transition-colors"
            >
              <p className="font-medium text-gray-900">로그아웃</p>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
