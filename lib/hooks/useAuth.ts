import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  isTokenExpired,
  logTokenInfo,
  getTokenRemainingTime,
} from "@/lib/auth";

interface UseAuthReturn {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshToken: () => void;
}

export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  // 로그아웃 함수
  const logout = useCallback(async () => {
    console.log("로그아웃 실행");
    await signOut({ redirect: false });
    setToken(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  // 토큰 새로고침 함수
  const refreshToken = useCallback(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    } else {
      logout();
    }
  }, [logout]);

  // 토큰 검증 함수
  const validateToken = useCallback(
    (tokenToValidate: string): boolean => {
      if (!tokenToValidate) {
        return false;
      }

      // 토큰 만료 여부 확인
      if (isTokenExpired(tokenToValidate)) {
        console.log("토큰이 만료되었습니다.");
        logout();
        return false;
      }

      // 개발 환경에서 토큰 정보 로깅
      logTokenInfo(tokenToValidate);

      // 토큰이 곧 만료될 예정인지 확인 (10분 이내)
      const remainingTime = getTokenRemainingTime(tokenToValidate);
      if (remainingTime < 10 * 60) {
        // 10분
        console.warn(
          `토큰이 곧 만료됩니다. 남은 시간: ${Math.floor(remainingTime / 60)}분`
        );
      }

      return true;
    },
    [logout]
  );

  // NextAuth 세션 기반 인증 상태 관리
  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setIsLoading(false);
      setIsAuthenticated(false);
      setToken(null);
      return;
    }

    if (status === "authenticated" && session) {
      const userToken = (session as any).token;
      if (userToken && validateToken(userToken)) {
        setToken(userToken);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setToken(null);
      }
      setIsLoading(false);
    }
  }, [status, session, validateToken]);

  // 주기적으로 토큰 검증 (1분마다)
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const interval = setInterval(() => {
      if (!validateToken(token)) {
        // 토큰이 만료되었으면 로그아웃
        logout();
      }
    }, 60000); // 1분마다

    return () => clearInterval(interval);
  }, [isAuthenticated, token, validateToken, logout]);

  return {
    token,
    isAuthenticated,
    isLoading,
    logout,
    refreshToken,
  };
}

// API 호출 전 토큰 검증을 위한 유틸리티 함수
export function validateTokenBeforeRequest(): string | null {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    console.warn("토큰이 없습니다.");
    return null;
  }

  if (isTokenExpired(token)) {
    console.warn("토큰이 만료되었습니다.");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    window.location.href = "/admin/login";
    return null;
  }

  return token;
}
