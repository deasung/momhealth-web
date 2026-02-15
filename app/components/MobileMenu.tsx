"use client";

import Link from "next/link";
import { Session } from "next-auth";
import { NavItem } from "@/app/types/navigation";
import { isNavItemActive } from "@/lib/utils/navUtils";
import UserInfo from "./UserInfo";

interface MobileMenuProps {
  isOpen: boolean;
  navItems: NavItem[];
  pathname: string;
  isClient: boolean;
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isLoggedIn: boolean;
  onClose: () => void;
  onLogout: () => void;
  openDropdown: string | null;
  onDropdownToggle: (label: string | null) => void;
}

const MobileMenu = ({
  isOpen,
  navItems,
  pathname,
  isClient,
  session,
  status,
  isLoggedIn,
  onClose,
  onLogout,
  openDropdown,
  onDropdownToggle,
}: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t border-gray-200 bg-gray-50">
      <div className="px-3 py-2 space-y-1">
        {/* 모바일 사용자 정보 */}
        <div className="px-3 py-2 text-sm border-b border-gray-200 mb-2">
          <UserInfo
            session={session}
            status={status}
            isLoggedIn={isLoggedIn}
            onLogout={onLogout}
            variant="mobile"
          />
        </div>

        {/* 모바일 네비게이션 */}
        {navItems.map((item) => {
          const isMenuItemActive = isNavItemActive(pathname, item, isClient);

          return (
            <div key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() =>
                      onDropdownToggle(
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
                            onDropdownToggle(null);
                            onClose();
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
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileMenu;
