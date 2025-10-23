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
      const shouldSave = (session as { shouldSaveToLocalStorage?: boolean })
        ?.shouldSaveToLocalStorage;

      if (userToken && shouldSave) {
        // NextAuth에서 지시한 경우에만 localStorage에 저장
        localStorage.setItem(TOKEN_KEYS.TOKEN, userToken);
        localStorage.setItem(TOKEN_KEYS.IS_GUEST, "false");
        setToken(userToken, false);
        setIsTokenSynced(true);
        console.log("🔄 NextAuth 세션에서 localStorage에 토큰 저장:", {
          hasToken: !!userToken,
          source: "NextAuth Session",
        });
      } else if (userToken) {
        // 이미 저장된 토큰이 있는 경우 API 시스템에만 설정
        setToken(userToken, false);
        setIsTokenSynced(true);
        console.log("🔄 기존 토큰을 API 시스템에 설정");
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
        console.log("🗑️ 로그아웃으로 인한 토큰 제거");
      } else if (storedToken && storedIsGuest) {
        // 게스트 토큰은 유지
        setToken(storedToken, true);
        setIsTokenSynced(true);
        console.log("👤 게스트 토큰 유지");
      } else {
        // 토큰이 없으면 초기화
        clearToken();
        setIsTokenSynced(true);
        console.log("🔄 토큰 없음, 게스트 모드로 전환");
      }
    }
  }, [session, status]);

  return { isTokenSynced };
}
