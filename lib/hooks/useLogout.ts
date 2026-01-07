import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { clearToken, getGuestToken } from "../api";
import { TOKEN_KEYS } from "../constants";

/**
 * 로그아웃 처리를 위한 커스텀 훅
 * NextAuth 로그아웃 + localStorage 초기화 + 게스트 토큰 발급
 */
export function useLogout() {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      console.log("🚪 로그아웃 시작");

      // 1. NextAuth 로그아웃 (세션 제거)
      await signOut({ redirect: false });

      // 2. localStorage 초기화 (refresh_token도 함께 제거)
      localStorage.removeItem(TOKEN_KEYS.TOKEN);
      localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      clearToken();

      console.log("🗑️ localStorage 초기화 완료");

      // 3. 게스트 토큰 발급
      try {
        const guestTokens = await getGuestToken();
        if (guestTokens) {
          // setToken 함수를 사용하여 access_token과 refresh_token 모두 저장
          const { setToken } = await import("../api");
          setToken(guestTokens.accessToken, true, guestTokens.refreshToken);
          console.log("👤 게스트 토큰 발급 완료 (refresh_token 포함)");
        }
      } catch (error) {
        console.error("게스트 토큰 발급 실패:", error);
      }

      // 4. 홈 페이지로 리다이렉트
      router.push("/");
      console.log("🏠 홈 페이지로 리다이렉트");
    } catch (error) {
      console.error("로그아웃 처리 중 오류:", error);
      // 오류가 발생해도 홈 페이지로 리다이렉트
      router.push("/");
    }
  }, [router]);

  return { logout };
}
