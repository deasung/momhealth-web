"use client";

import Link from "next/link";
import { MutableRefObject } from "react";
import { NavItem } from "@/app/types/navigation";
import { isNavItemActive } from "@/lib/utils/navUtils";

interface DesktopNavProps {
  navItems: NavItem[];
  pathname: string;
  isClient: boolean;
  openDropdown: string | null;
  onDropdownToggle: (label: string | null) => void;
  dropdownRefs: MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

const DesktopNav = ({
  navItems,
  pathname,
  isClient,
  openDropdown,
  onDropdownToggle,
  dropdownRefs,
}: DesktopNavProps) => {
  return (
    <nav className="hidden md:flex gap-6 items-center">
      {navItems.map((item) => {
        const isMenuItemActive = isNavItemActive(pathname, item, isClient);

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
                    onDropdownToggle(
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
                      openDropdown === item.label ? "rotate-180" : "rotate-0"
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
                          onClick={() => onDropdownToggle(null)}
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
  );
};

export default DesktopNav;
