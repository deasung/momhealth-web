"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const Header = () => {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isClient, setIsClient] = useState(false);

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

  useEffect(() => {
    const handleRouteChange = () => {
      setOpenDropdown(null);
    };
    if (isClient) {
      router.events.on("routeChangeStart", handleRouteChange);
    }
    return () => {
      if (isClient) {
        router.events.off("routeChangeStart", handleRouteChange);
      }
    };
  }, [router, isClient]);

  const navItems = [
    { label: "홈", path: "/" },
    {
      label: "건강질문",
      children: [
        { label: "질문하기", path: "/health-questions/ask" },
        { label: "질문목록", path: "/health-questions/list" },
        { label: "전문의 답변", path: "/health-questions/answers" },
      ],
    },
    {
      label: "커뮤니티",
      children: [{ label: "자유게시판", path: "/community/free" }],
    },
    { label: "마이", path: "/my" },
  ];

  return (
    <header className="bg-black text-white px-6 py-3 flex items-center justify-between shadow-md">
      {/* ✨ 로고를 클릭 가능한 Link로 변경합니다. */}
      <Link href="/admin" legacyBehavior>
        <a className="font-bold text-lg cursor-pointer hover:text-gray-300 transition-colors">
          오늘의 건강{" "}
        </a>
      </Link>

      <nav className="flex gap-2 items-center">
        {navItems.map((item) => {
          const getIsActive = () => {
            if (!isClient) return false;
            if (item.children) {
              return item.children.some((child) =>
                router.pathname.startsWith(child.path)
              );
            }
            if (item.path) {
              return router.pathname.startsWith(item.path);
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
                    className={`relative flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                      isMenuItemActive
                        ? "bg-gray-700 font-semibold"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`ml-2 transform transition-transform duration-200 ${
                        openDropdown === item.label ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-gray-800 rounded-md shadow-lg z-20 overflow-hidden">
                      <div className="py-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            href={child.path}
                            className={`block px-4 py-2 text-sm text-gray-200 transition-colors duration-150 ${
                              router.pathname === child.path
                                ? "bg-gray-700 font-semibold text-white"
                                : "hover:bg-gray-700 hover:text-white"
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
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      isMenuItemActive
                        ? "bg-gray-700 font-semibold"
                        : "hover:bg-gray-700"
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

      <div className="flex items-center gap-4 text-sm">
        <span>사용자 님 환영합니다!</span>
        <button className="border border-white text-white px-3 py-1 rounded hover:bg-white hover:text-black transition duration-200">
          로그인
        </button>
      </div>
    </header>
  );
};

export default Header;
