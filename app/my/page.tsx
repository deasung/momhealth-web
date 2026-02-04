"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { useAuth } from "../../lib/hooks/useAuth";
import { useLogout } from "../../lib/hooks/useLogout";
import { useTokenSync } from "../../lib/hooks/useTokenSync";
import { getUserProfile, withdrawAccount } from "../../lib/api";
import type { UserProfile } from "../types/user";
import { logger } from "@/lib/logger";

export default function MyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isTokenSynced } = useTokenSync(); // 세션 토큰을 localStorage에 동기화
  const { logout } = useLogout();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleWithdraw = useCallback(async () => {
    if (withdrawing) return;
    if (!confirm("정말 탈퇴하시겠습니까?")) return;

    try {
      setWithdrawing(true);
      const response = await withdrawAccount();
      alert(response?.message || "회원탈퇴가 완료되었습니다.");
      await logout();
    } catch (error: unknown) {
      let errorMessage = "회원탈퇴 중 오류가 발생했습니다.";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { status?: number; data?: { error?: string } };
        };
        if (apiError.response?.status === 401) {
          errorMessage = "로그인이 필요합니다.";
        } else if (apiError.response?.status === 404) {
          errorMessage = "사용자 정보를 찾을 수 없습니다.";
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        }
      }

      alert(errorMessage);
    } finally {
      setWithdrawing(false);
    }
  }, [logout, withdrawing]);

  // 프로필 로딩 실패 플래그 (무한 루프 방지)
  const profileErrorRef = useRef(false);

  // 메모리 최적화: 컴포넌트 언마운트 추적
  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      if (
        isAuthenticated &&
        !isLoading &&
        isTokenSynced &&
        mounted &&
        !profileErrorRef.current
      ) {
        try {
          setProfileLoading(true);
          profileErrorRef.current = false;
          const response = await getUserProfile();

          // 컴포넌트가 언마운트되지 않았을 때만 상태 업데이트
          if (!isCancelled) {
            setUserProfile(response.user);
            profileErrorRef.current = false;
          }
        } catch (error) {
          logger.error("프로필 로딩 실패:", error);
          if (!isCancelled) {
            profileErrorRef.current = true;
            const axiosError = error as { response?: { status?: number } };
            if (
              axiosError.response?.status === 401 ||
              axiosError.response?.status === 403
            ) {
              profileErrorRef.current = true;
            }
          }
        } finally {
          if (!isCancelled) {
            setProfileLoading(false);
          }
        }
      }
    };

    loadProfile();

    // 컴포넌트 언마운트 시 클린업
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, isTokenSynced, mounted]);

  // Hydration 오류를 방지하기 위해, 클라이언트에서 마운트된 후에만 UI를 렌더링합니다.
  // 서버 렌더링과 초기 클라이언트 렌더링 시에는 항상 로딩 스피너를 보여주어 일관성을 유지합니다.
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <SEO
          title="마이페이지"
          description="나의 건강 정보와 활동 내역을 확인하고 관리해보세요."
          noindex={true}
        />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // 마운트 후, 인증 상태를 확인하여 비로그인 사용자에게는 로그인 페이지로 안내합니다.
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="마이페이지"
          description="나의 건강 정보와 활동 내역을 확인하고 관리해보세요."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center">
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
      <SEO
        title="마이페이지"
        description="나의 건강 정보와 활동 내역을 확인하고 관리해보세요."
        noindex={true}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ✅ SEO & 디자인: 헤더 섹션 (친구 화면과 통일감 있게) */}
        <section className="mb-8 md:mb-12">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              마이
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              나의 건강 정보와 활동 내역을 확인하고 관리해보세요.
            </p>
          </div>
        </section>

        {/* 사용자 프로필 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mr-4 flex-shrink-0 overflow-hidden">
              {profileLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              ) : userProfile?.userThumbnailUrl ? (
                <Image
                  src={`${
                    process.env.NEXT_PUBLIC_CDN_URL ||
                    "https://di7imxmn4pwuq.cloudfront.net"
                  }/${userProfile.userThumbnailUrl}`}
                  alt={userProfile.nickname}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {profileLoading ? (
                  <span className="inline-block h-6 bg-gray-200 rounded animate-pulse w-24"></span>
                ) : (
                  `${userProfile?.nickname || "사용자"}님`
                )}
              </h2>
              <p className="text-sm text-gray-500">
                {profileLoading ? (
                  <span className="inline-block h-4 bg-gray-200 rounded animate-pulse w-20"></span>
                ) : userProfile?.isSocial ? (
                  `${userProfile.socialProvider || "소셜"} 연동`
                ) : (
                  "이메일 가입"
                )}
              </p>
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
            <button
              onClick={() => {
                if (userProfile?.id) {
                  window.location.href = `/health-questions/user-completed?userId=${userProfile.id}`;
                }
              }}
              className="p-6 text-center hover:bg-gray-50 transition-colors w-full"
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
            </button>

            <Link
              href="/community/my-posts"
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
              href="/my/inquire"
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
              href="/my/notices"
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
                handleWithdraw();
              }}
              className="p-6 text-center hover:bg-gray-50 transition-colors text-red-600"
              disabled={withdrawing}
            >
              <p className="font-medium">
                {withdrawing ? "처리 중..." : "회원 탈퇴"}
              </p>
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
