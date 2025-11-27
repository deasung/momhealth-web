import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setToken, clearToken } from "../api";
import { TOKEN_KEYS } from "../constants";

/**
 * NextAuth 세션과 localStorage 토큰을 동기화하는 훅
 * 세션 변경 시 자동으로 localStorage에 토큰을 저장/제거
 */
export function useTokenSync() {
  const { data: session, status } = useSession();
  const [isTokenSynced, setIsTokenSynced] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (session) {
      const userToken =
        (session as { token?: string; accessToken?: string })?.token ||
        (session as { token?: string; accessToken?: string })?.accessToken;
      const refreshToken = (session as { refreshToken?: string })?.refreshToken;

      if (userToken) {
        // 로그인 토큰은 항상 localStorage에 저장 (refresh_token 포함)
        localStorage.setItem(TOKEN_KEYS.TOKEN, userToken);
        localStorage.setItem(TOKEN_KEYS.IS_GUEST, "false");

        // refresh token도 항상 저장
        if (refreshToken) {
          localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
        } else {
          // refresh_token이 없으면 기존 것을 유지하거나 제거하지 않음
          // (이미 저장된 refresh_token이 있을 수 있음)
        }

        setToken(userToken, false, refreshToken);
        setIsTokenSynced(true);
      }
    } else {
      // 세션이 없으면 localStorage에서 토큰 확인
      const storedToken = localStorage.getItem(TOKEN_KEYS.TOKEN);
      const storedIsGuest =
        localStorage.getItem(TOKEN_KEYS.IS_GUEST) === "true";

      if (storedToken && !storedIsGuest) {
        // 사용자 토큰이 있으면 제거 (로그아웃 상태, refresh_token도 함께 제거)
        localStorage.removeItem(TOKEN_KEYS.TOKEN);
        localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
        clearToken();
        setIsTokenSynced(true);
      } else if (storedToken && storedIsGuest) {
        // 게스트 토큰은 유지 (refresh_token도 함께 복원)
        const storedRefreshToken = localStorage.getItem(
          TOKEN_KEYS.REFRESH_TOKEN
        );
        setToken(storedToken, true, storedRefreshToken);
        setIsTokenSynced(true);
      } else {
        // 토큰이 없으면 초기화
        clearToken();
        setIsTokenSynced(true);
      }
    }
  }, [session, status]);

  return { isTokenSynced };
}
