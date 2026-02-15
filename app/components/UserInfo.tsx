"use client";

import Link from "next/link";
import { Session } from "next-auth";

interface UserInfoProps {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isLoggedIn: boolean;
  onLogout: () => void;
  variant: "desktop" | "mobile";
}

const UserInfo = ({
  session,
  status,
  isLoggedIn,
  onLogout,
  variant,
}: UserInfoProps) => {
  const isDesktop = variant === "desktop";

  if (status === "loading") {
    return (
      <span className={`text-gray-500 ${isDesktop ? "" : ""}`}>
        로딩 중...
      </span>
    );
  }

  if (isLoggedIn) {
    return (
      <div
        className={`flex ${
          isDesktop ? "items-center gap-4" : "flex-col gap-2"
        } text-sm`}
      >
        <span className="text-gray-700">
          {session?.user?.nickname || session?.user?.name || "사용자"}님
          환영합니다!
        </span>
        <button
          onClick={onLogout}
          className={`border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg ${
            isDesktop
              ? "hover:bg-gray-50 hover:border-gray-400"
              : "hover:bg-gray-100 hover:border-gray-400"
          } transition-colors text-sm`}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isDesktop ? "items-center gap-4" : "flex-col gap-2"}`}
    >
      <span className="text-gray-700 text-sm">게스트님 환영합니다!</span>
      <Link
        href="/login"
        className={`bg-orange-500 hover:bg-orange-600 text-white px-${
          isDesktop ? "4" : "3"
        } py-${
          isDesktop ? "2" : "1.5"
        } rounded-lg transition-colors text-sm font-medium ${
          isDesktop ? "" : "inline-block text-center"
        }`}
      >
        로그인
      </Link>
    </div>
  );
};

export default UserInfo;
