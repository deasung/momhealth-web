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
      const shouldSave = (session as { shouldSaveToLocalStorage?: boolean })
        ?.shouldSaveToLocalStorage;

      if (userToken && shouldSave) {
        // NextAuth에서 지시한 경우에만 localStorage에 저장
        localStorage.setItem(TOKEN_KEYS.TOKEN, userToken);
        localStorage.setItem(TOKEN_KEYS.IS_GUEST, "false");

        // refresh token도 저장
        if (refreshToken) {
          localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
        }

        setToken(userToken, false, refreshToken);
        setIsTokenSynced(true);
      } else if (userToken) {
        // 이미 저장된 토큰이 있는 경우 API 시스템에만 설정
        setToken(userToken, false, refreshToken);
        setIsTokenSynced(true);
      }
    } else {
      // 세션이 없으면 localStorage에서 토큰 확인
      const storedToken = localStorage.getItem(TOKEN_KEYS.TOKEN);
      const storedIsGuest =
        localStorage.getItem(TOKEN_KEYS.IS_GUEST) === "true";

      if (storedToken && !storedIsGuest) {
        // 사용자 토큰이 있으면 제거 (로그아웃 상태)
        localStorage.removeItem(TOKEN_KEYS.TOKEN);
        localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
        clearToken();
        setIsTokenSynced(true);
      } else if (storedToken && storedIsGuest) {
        // 게스트 토큰은 유지
        setToken(storedToken, true);
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
