"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLogout } from "../../lib/hooks/useLogout";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isClient, setIsClient] = useState(false);
  const { logout } = useLogout();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown &&
        dropdownRefs.current[openDropdown] &&
        !dropdownRefs.current[openDropdown]?.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    if (isClient) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      if (isClient) {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, [openDropdown, isClient]);

  // App Router에서는 pathname이 변경될 때마다 실행
  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  type NavItem = {
    label: string;
    path: string;
    children?: Array<{ label: string; path: string }>;
  };

  // 로그인된 경우에만 친구와 마이 메뉴 추가
  const isLoggedIn = session && status === "authenticated";
  const navItems: NavItem[] = [
    { label: "홈", path: "/" },
    ...(isLoggedIn ? [{ label: "친구", path: "/friends" }] : []),
    {
      label: "건강질문",
      path: "/health-questions/list",
    },
    {
      label: "커뮤니티",
      path: "/community/list",
    },
    ...(isLoggedIn ? [{ label: "마이", path: "/my" }] : []),
  ];

  return (
    <header className="bg-white border-b border-gray-100">
      {/* 메인 헤더 */}
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between max-w-6xl mx-auto">
        {/* 로고 */}
        <Link
          href="/"
          className="font-bold text-xl md:text-2xl cursor-pointer text-gray-900 hover:text-orange-500 transition-colors whitespace-nowrap"
        >
          오늘의 건강
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => {
            const getIsActive = () => {
              if (!isClient) return false;
              if (item.children) {
                return item.children.some(
                  (child) =>
                    pathname === child.path ||
                    pathname.startsWith(child.path + "/")
                );
              }
              if (item.path) {
                // 홈 페이지는 정확히 일치해야 함
                if (item.path === "/") {
                  return pathname === "/";
                }
                return (
                  pathname === item.path || pathname.startsWith(item.path + "/")
                );
              }
              return false;
            };
            const isMenuItemActive = getIsActive();

            return (
              <div
                key={item.label}
                className="relative"
                ref={(el) => {
                  dropdownRefs.current[item.label] = el;
                }}
              >
                {item.children ? (
                  <>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === item.label ? null : item.label
                        )
                      }
                      className={`relative flex items-center px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium whitespace-nowrap ${
                        isMenuItemActive
                          ? "text-orange-500 font-semibold"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <span className="whitespace-nowrap">{item.label}</span>
                      <svg
                        className={`ml-1 w-4 h-4 transform transition-transform duration-200 ${
                          openDropdown === item.label
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {openDropdown === item.label && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                        <div className="py-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              href={child.path}
                              className={`block px-4 py-2 text-sm transition-colors duration-150 ${
                                pathname === child.path
                                  ? "bg-orange-50 text-orange-500 font-semibold"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                              onClick={() => setOpenDropdown(null)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link key={item.path} href={item.path!}>
                    <span
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium whitespace-nowrap ${
                        isMenuItemActive
                          ? "text-orange-500 font-semibold"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* 데스크톱 사용자 정보 */}
        <div className="hidden md:flex items-center gap-4 text-sm whitespace-nowrap">
          {status === "loading" ? (
            <span className="text-gray-500">로딩 중...</span>
          ) : session ? (
            <>
              <span className="text-gray-700">
                {session.user?.nickname || session.user?.name || "사용자"}님
                환영합니다!
              </span>
              <button
                onClick={logout}
                className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <span className="text-gray-700">게스트님 환영합니다!</span>
              <Link
                href="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                로그인
              </Link>
            </>
          )}
        </div>

        {/* 모바일 햄버거 메뉴 버튼 */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-3 py-2 space-y-1">
            {/* 모바일 사용자 정보 */}
            <div className="px-3 py-2 text-sm border-b border-gray-200 mb-2">
              {status === "loading" ? (
                <span>로딩 중...</span>
              ) : session ? (
                <div className="flex flex-col gap-2">
                  <span className="text-gray-700">
                    {session.user?.nickname || session.user?.name || "사용자"}님
                    환영합니다!
                  </span>
                  <button
                    onClick={logout}
                    className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-gray-700">게스트님 환영합니다!</span>
                  <Link
                    href="/login"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors text-sm inline-block text-center"
                  >
                    로그인
                  </Link>
                </div>
              )}
            </div>

            {/* 모바일 네비게이션 */}
            {navItems.map((item) => {
              const getIsActive = () => {
                if (!isClient) return false;
                if (item.children) {
                  return item.children.some(
                    (child) =>
                      pathname === child.path ||
                      pathname.startsWith(child.path + "/")
                  );
                }
                if (item.path) {
                  // 홈 페이지는 정확히 일치해야 함
                  if (item.path === "/") {
                    return pathname === "/";
                  }
                  return (
                    pathname === item.path ||
                    pathname.startsWith(item.path + "/")
                  );
                }
                return false;
              };
              const isMenuItemActive = getIsActive();

              return (
                <div key={item.label}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === item.label ? null : item.label
                          )
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                          isMenuItemActive
                            ? "bg-orange-50 text-orange-500 font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          {item.label}
                          <svg
                            className={`w-4 h-4 transform transition-transform duration-200 ${
                              openDropdown === item.label
                                ? "rotate-180"
                                : "rotate-0"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </span>
                      </button>
                      {openDropdown === item.label && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              href={child.path}
                              className={`block px-3 py-2 text-sm text-gray-600 rounded-lg transition-colors duration-150 ${
                                pathname === child.path
                                  ? "bg-orange-50 text-orange-500 font-semibold"
                                  : "hover:bg-gray-100 hover:text-gray-900"
                              }`}
                              onClick={() => {
                                setOpenDropdown(null);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.path!}
                      className={`block px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                        isMenuItemActive
                          ? "bg-orange-50 text-orange-500 font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
