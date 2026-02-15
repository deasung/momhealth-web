"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession, useSession } from "next-auth/react";
import { TOKEN_KEYS } from "../constants";
import { refreshAuthToken, setToken, verifyAuthToken } from "../api";
import { isTokenExpired } from "../auth";

type EnsureAuthFailureReason =
  | "loading"
  | "unauthenticated"
  | "token_missing"
  | "token_expired"
  | "guest_token"
  | "token_invalid"
  | "sync_failed";

export type EnsureAuthResult =
  | { ok: true }
  | { ok: false; reason: EnsureAuthFailureReason };

export function useEnsureAuth() {
  const router = useRouter();
  const { status } = useSession();

  const ensureAuth = useCallback(
    async (options?: {
      redirectToLogin?: boolean;
      verifyWithServer?: boolean;
    }): Promise<EnsureAuthResult> => {
      if (status === "loading") {
        return { ok: false, reason: "loading" };
      }

      if (status !== "authenticated") {
        if (options?.redirectToLogin) {
          router.push("/login");
        }
        return { ok: false, reason: "unauthenticated" };
      }

      if (typeof window === "undefined") {
        return { ok: false, reason: "sync_failed" };
      }

      const storedToken = localStorage.getItem(TOKEN_KEYS.TOKEN);
      const storedIsGuest = localStorage.getItem(TOKEN_KEYS.IS_GUEST) === "true";
      const storedRefreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);

      if (storedToken && !storedIsGuest && !isTokenExpired(storedToken)) {
        if (options?.verifyWithServer) {
          const ok = await verifyAuthToken(storedToken);
          if (!ok) {
            localStorage.removeItem(TOKEN_KEYS.TOKEN);
            localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
            localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
            return { ok: false, reason: "token_invalid" };
          }
        }
        return { ok: true };
      }

      if (
        storedRefreshToken &&
        !storedIsGuest &&
        (!storedToken || isTokenExpired(storedToken))
      ) {
        const refreshed = await refreshAuthToken(storedRefreshToken);
        if (refreshed) {
          localStorage.setItem(TOKEN_KEYS.TOKEN, refreshed.accessToken);
          localStorage.setItem(TOKEN_KEYS.IS_GUEST, "false");
          localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshed.refreshToken);
          setToken(refreshed.accessToken, false, refreshed.refreshToken);

          if (options?.verifyWithServer) {
            const ok = await verifyAuthToken(refreshed.accessToken);
            if (!ok) {
              localStorage.removeItem(TOKEN_KEYS.TOKEN);
              localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
              localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
              if (options?.redirectToLogin) {
                router.push("/login");
              }
              return { ok: false, reason: "token_invalid" };
            }
          }

          return { ok: true };
        }
      }

      if (!storedToken) {
        // 세션은 있는데 localStorage 토큰이 없으면 세션에서 동기화 시도
      } else if (storedIsGuest) {
        // 게스트 토큰이면 사용자 토큰 동기화 시도
      } else if (isTokenExpired(storedToken)) {
        // 만료된 토큰이면 세션 기반 동기화 시도
      }

      try {
        const session = await getSession();
        const sessionToken =
          (session as { token?: string; accessToken?: string })?.token ||
          (session as { token?: string; accessToken?: string })?.accessToken;
        const sessionRefreshToken = (session as { refreshToken?: string })
          ?.refreshToken;

        if (sessionToken) {
          localStorage.setItem(TOKEN_KEYS.TOKEN, sessionToken);
          localStorage.setItem(TOKEN_KEYS.IS_GUEST, "false");
          if (sessionRefreshToken) {
            localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, sessionRefreshToken);
          }
          setToken(sessionToken, false, sessionRefreshToken);

          if (!isTokenExpired(sessionToken)) {
            if (options?.verifyWithServer) {
              const ok = await verifyAuthToken(sessionToken);
              if (!ok) {
                localStorage.removeItem(TOKEN_KEYS.TOKEN);
                localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
                localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
                if (options?.redirectToLogin) {
                  router.push("/login");
                }
                return { ok: false, reason: "token_invalid" };
              }
            }
            return { ok: true };
          }
          if (sessionRefreshToken) {
            const refreshed = await refreshAuthToken(sessionRefreshToken);
            if (refreshed) {
              localStorage.setItem(TOKEN_KEYS.TOKEN, refreshed.accessToken);
              localStorage.setItem(TOKEN_KEYS.IS_GUEST, "false");
              localStorage.setItem(
                TOKEN_KEYS.REFRESH_TOKEN,
                refreshed.refreshToken
              );
              setToken(refreshed.accessToken, false, refreshed.refreshToken);

              if (options?.verifyWithServer) {
                const ok = await verifyAuthToken(refreshed.accessToken);
                if (!ok) {
                  localStorage.removeItem(TOKEN_KEYS.TOKEN);
                  localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
                  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
                  if (options?.redirectToLogin) {
                    router.push("/login");
                  }
                  return { ok: false, reason: "token_invalid" };
                }
              }

              return { ok: true };
            }
          }

          return { ok: false, reason: "token_expired" };
        }

        if (options?.redirectToLogin) {
          router.push("/login");
        }
        return { ok: false, reason: "sync_failed" };
      } catch (error) {
        if (options?.redirectToLogin) {
          router.push("/login");
        }
        return { ok: false, reason: "sync_failed" };
      }
    },
    [router, status]
  );

  return { ensureAuth };
}

