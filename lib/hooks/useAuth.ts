import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isTokenExpired } from "@/lib/auth";
import { TOKEN_KEYS } from "../constants";

interface UseAuthReturn {
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshToken: () => void;
}

export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // 로그아웃 함수
  const logout = useCallback(async () => {
    // localStorage에서 토큰 제거
    localStorage.removeItem(TOKEN_KEYS.TOKEN);
    localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
    setToken(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  // 토큰 새로고침 함수
  const refreshToken = useCallback(() => {
    const storedToken = localStorage.getItem(TOKEN_KEYS.TOKEN);
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    } else {
      logout();
    }
  }, [logout]);

  // 토큰 검증 함수
  const validateToken = useCallback((tokenToValidate: string): boolean => {
    if (!tokenToValidate) {
      return false;
    }

    // 토큰 만료 여부 확인
    if (isTokenExpired(tokenToValidate)) {
      return false;
    }

    return true;
  }, []);

  // NextAuth 세션 및 localStorage 기반 인증 상태 관리
  useEffect(() => {
    const initializeAuth = () => {
      // NextAuth 세션 로딩 중이면 대기
      if (sessionStatus === "loading") {
        return;
      }

      try {
        // 1. NextAuth 세션이 있으면 인증된 상태로 처리
        if (session) {
          const userToken =
            (session as { token?: string; accessToken?: string })?.token ||
            (session as { token?: string; accessToken?: string })?.accessToken;

          if (userToken) {
            setToken(userToken);
            setIsGuest(false);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // 2. NextAuth 세션이 없으면 localStorage 확인
        const storedToken = localStorage.getItem(TOKEN_KEYS.TOKEN);
        const storedIsGuest =
          localStorage.getItem(TOKEN_KEYS.IS_GUEST) === "true";

        if (storedToken) {
          if (validateToken(storedToken)) {
            setToken(storedToken);
            setIsGuest(storedIsGuest);
            // 게스트 토큰이면 인증되지 않은 상태로 처리
            setIsAuthenticated(!storedIsGuest);
          } else {
            // 토큰이 만료되었으면 localStorage에서 제거
            localStorage.removeItem(TOKEN_KEYS.TOKEN);
            localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
            setToken(null);
            setIsAuthenticated(false);
            setIsGuest(false);
          }
        } else {
          setToken(null);
          setIsAuthenticated(false);
          setIsGuest(false);
        }
      } catch (error) {
        setToken(null);
        setIsAuthenticated(false);
        setIsGuest(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [session, sessionStatus, validateToken]);

  // 주기적으로 토큰 검증 (5분마다)
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const interval = setInterval(() => {
      if (!validateToken(token)) {
        // 토큰이 만료되었으면 로그아웃
        logout();
      }
    }, 300000); // 5분마다

    return () => clearInterval(interval);
  }, [isAuthenticated, token, validateToken, logout]);

  return {
    token,
    isAuthenticated,
    isGuest,
    isLoading,
    logout,
    refreshToken,
  };
}

// API 호출 전 토큰 검증을 위한 유틸리티 함수
export function validateTokenBeforeRequest(): string | null {
  const token = localStorage.getItem(TOKEN_KEYS.TOKEN);

  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEYS.TOKEN);
    localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
    return null;
  }

  return token;
}
