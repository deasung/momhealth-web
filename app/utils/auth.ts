// 인증 관련 유틸리티 함수들
import { logger } from "@/lib/logger";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// 토큰 저장
export const setAuthTokens = (tokens: AuthTokens) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }
};

// 토큰 가져오기
export const getAuthTokens = (): AuthTokens | null => {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (!accessToken || !refreshToken) return null;

  return { access_token: accessToken, refresh_token: refreshToken };
};

// 사용자 정보 저장
export const setUser = (user: User) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

// 사용자 정보 가져오기
export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// 로그인 상태 확인
export const isAuthenticated = (): boolean => {
  const tokens = getAuthTokens();
  return tokens !== null;
};

// 로그아웃
export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }
};

// API 요청용 헤더 생성
export const getAuthHeaders = (): HeadersInit => {
  const tokens = getAuthTokens();
  if (!tokens) return {};

  return {
    Authorization: `Bearer ${tokens.access_token}`,
    "Content-Type": "application/json",
  };
};

// 토큰 갱신
export const refreshTokens = async (): Promise<AuthTokens | null> => {
  const tokens = getAuthTokens();
  if (!tokens) return null;

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      setAuthTokens(data.data);
      return data.data;
    }

    return null;
  } catch (error) {
    logger.error("Token refresh failed:", error);
    return null;
  }
};
