"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLogout } from "../../lib/hooks/useLogout";
import { NavItem } from "@/app/types/navigation";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import UserInfo from "./UserInfo";

const Header = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { logout } = useLogout();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 이벤트 리스너 정리 최적화 (메모리 누수 방지)
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

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // App Router에서는 pathname이 변경될 때마다 실행
  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isLoggedIn = status === "authenticated";

  // Hydration 오류 방지를 위해 isClient가 true일 때만 동적 메뉴를 추가
  const navItems: NavItem[] = [
    { label: "홈", path: "/" },
    ...(isClient && isLoggedIn ? [{ label: "친구", path: "/friends" }] : []),
    {
      label: "건강질문",
      path: "/health-questions/list",
    },
    {
      label: "커뮤니티",
      path: "/community/list",
    },
    ...(isClient && isLoggedIn ? [{ label: "마이", path: "/my" }] : []),
  ];

  return (
    <header className="bg-white border-b border-gray-100">
      {/* 메인 헤더 */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between max-w-7xl mx-auto">
        {/* 로고 */}
        <Link
          href="/"
          className="font-bold text-xl md:text-2xl cursor-pointer text-gray-900 hover:text-orange-500 transition-colors whitespace-nowrap"
        >
          오늘의 건강
        </Link>

        {/* 데스크톱 네비게이션 */}
        <DesktopNav
          navItems={navItems}
          pathname={pathname}
          isClient={isClient}
          openDropdown={openDropdown}
          onDropdownToggle={setOpenDropdown}
          dropdownRefs={dropdownRefs}
        />

        {/* 데스크톱 사용자 정보 */}
        <div className="hidden md:flex items-center gap-4 text-sm whitespace-nowrap">
          {/* 클라이언트에서만 사용자 정보 렌더링 */}
          {isClient && (
            <UserInfo
              session={session}
              status={status}
              isLoggedIn={isLoggedIn}
              onLogout={logout}
              variant="desktop"
            />
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

      {/* 모바일 메뉴 - 클라이언트에서만 렌더링 */}
      {isClient && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          navItems={navItems}
          pathname={pathname}
          isClient={isClient}
          session={session}
          status={status}
          isLoggedIn={isLoggedIn}
          onClose={() => setIsMobileMenuOpen(false)}
          onLogout={logout}
          openDropdown={openDropdown}
          onDropdownToggle={setOpenDropdown}
        />
      )}
    </header>
  );
};

export default Header;
