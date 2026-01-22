import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { logger } from "@/lib/logger";

// 타입 정의
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // 세션 ID (기존 유지)
      user_id?: string; // 실제 DB 사용자 ID
      name: string;
      email: string;
      nickname?: string;
    };
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    token?: string;
    nickname?: string;
    refreshToken?: string;
    user_id?: string; // 실제 DB 사용자 ID
  }
}

// 환경 변수는 .env에서 주입됨

// JWT 토큰 만료 시간 확인
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    logger.error("토큰 파싱 실패:", error);
    return true; // 파싱 실패 시 만료된 것으로 간주
  }
}

// 서버 시작 시 환경 변수 확인 (모듈 로드 시점에 실행)
// Next.js standalone 모드에서 런타임 환경 변수를 직접 읽기
if (typeof process !== "undefined" && process.env) {
  const baseURL = process.env.MOMHEALTH_API_URL;
  const apiKey = process.env.MOMHEALTH_API_KEY;

  if (!baseURL || !apiKey) {
    logger.error("❌ [NextAuth] 환경변수 누락 (서버 시작 시):", {
      MOMHEALTH_API_URL: baseURL || "undefined",
      MOMHEALTH_API_KEY: apiKey ? "설정됨" : "undefined",
      nodeEnv: process.env.NODE_ENV,
    });
  } else {
    logger.info("✅ [NextAuth] 환경변수 확인 완료:", {
      MOMHEALTH_API_URL: baseURL ? "설정됨" : "누락",
      MOMHEALTH_API_KEY: apiKey ? "설정됨" : "누락",
      nodeEnv: process.env.NODE_ENV,
    });
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // 카카오 로그인창 강제 표시
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // 구글 로그인창 강제 표시
        },
      },
    }),
    CredentialsProvider({
      name: "로그인",
      credentials: {
        email: { label: "이메일", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 서버 사이드에서 백엔드 절대 URL로 직접 호출 (프록시, 인터셉터 우회)
          const baseURL = process.env.MOMHEALTH_API_URL;
          const apiKey = process.env.MOMHEALTH_API_KEY;

          if (!baseURL || !apiKey) {
            logger.error("❌ 환경변수 누락:", {
              MOMHEALTH_API_URL: baseURL ? "설정됨" : "누락",
              MOMHEALTH_API_KEY: apiKey ? "설정됨" : "누락",
            });
            return null;
          }

          const response = await axios.post(
            `${baseURL}/public/auth/token/login`,
            {
              email: credentials.email,
              password: credentials.password,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
              timeout: 10000,
            }
          );

          const data = response.data;

          if (
            response.status !== 200 ||
            !data?.success ||
            !data?.access_token
          ) {
            return null;
          }

          const userObj: {
            id: string;
            user_id?: string; // 실제 DB 사용자 ID
            name: string;
            email: string;
            nickname?: string;
            token?: string;
            refreshToken?: string;
          } = {
            id: data.user?.id?.toString() || "1", // 세션 ID (기존 유지)
            user_id: data.user?.id?.toString(), // 실제 DB 사용자 ID
            name: data.user?.nickname || credentials.email,
            email: credentials.email,
            nickname: data.user?.nickname,
            token: data.access_token,
            refreshToken: data.refresh_token,
          };
          return userObj;
        } catch (error: unknown) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.provider) return true;

      if (account.provider === "kakao" || account.provider === "google") {
        try {
          const apiKey = process.env.MOMHEALTH_API_KEY;
          const baseURL = process.env.MOMHEALTH_API_URL;

          if (!baseURL || !apiKey) {
            logger.error("❌ 환경변수 누락 (소셜 로그인 signIn):", {
              MOMHEALTH_API_URL: baseURL ? "설정됨" : "누락",
              MOMHEALTH_API_KEY: apiKey ? "설정됨" : "누락",
            });
            return "/login?error=ENV_NOT_CONFIGURED";
          }

          const response = await axios.post(
            `${baseURL}/public/auth/social-login`,
            {
              provider: account.provider,
              socialId: account.providerAccountId,
              email: user.email,
              nickname: user.name,
              profileImage: (user as { image?: string | null }).image || null,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
            }
          );

          if (response.data?.success) {
            (user as { backendAccessToken?: string }).backendAccessToken =
              response.data.access_token;
            (user as { backendRefreshToken?: string }).backendRefreshToken =
              response.data.refresh_token;
            (user as { backendNickname?: string }).backendNickname =
              response.data.user?.nickname;
            (user as { backendUserId?: string }).backendUserId =
              response.data.user?.id?.toString();
            return true;
          }

          if (response.data?.code === "WITHDRAWN_USER") {
            return "/login?error=WITHDRAWN_USER";
          }

          return "/login?error=SOCIAL_LOGIN_FAILED";
        } catch (error: unknown) {
          const axiosError = error as {
            response?: {
              status?: number;
              data?: unknown;
            };
          };

          if (axiosError.response?.status === 403) {
            const data = axiosError.response.data as
              | { code?: string; message?: string; error?: { code?: string; message?: string } }
              | string
              | null
              | undefined;
            const code =
              typeof data === "object" && data
                ? data.code || data.error?.code
                : undefined;
            const message =
              typeof data === "object" && data
                ? data.message || data.error?.message
                : typeof data === "string"
                ? data
                : undefined;

            if (code === "WITHDRAWN_USER" || (message && message.includes("탈퇴"))) {
              return "/login?error=WITHDRAWN_USER";
            }
            return "/login?error=ACCESS_DENIED";
          }

          if (axiosError.response?.status === 409) {
            return "/login?error=EMAIL_IN_USE";
          }

          logger.error("❌ 소셜 로그인 백엔드 API 실패 (signIn):", error);
          return "/login?error=SOCIAL_LOGIN_FAILED";
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.user_id = (user as { user_id?: string }).user_id; // 실제 DB 사용자 ID
        token.name = user.name;
        token.email = user.email;
        token.nickname = (user as { nickname?: string }).nickname;
        token.token = (user as { token?: string }).token;
        token.accessToken = (user as { token?: string }).token;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;

        // 소셜 로그인인 경우 백엔드 API 호출
        if (account?.provider === "kakao" || account?.provider === "google") {
          try {
            const backendAccessToken = (user as { backendAccessToken?: string })
              .backendAccessToken;
            const backendRefreshToken = (user as { backendRefreshToken?: string })
              .backendRefreshToken;
            const backendNickname = (user as { backendNickname?: string })
              .backendNickname;
            const backendUserId = (user as { backendUserId?: string })
              .backendUserId;

            if (backendAccessToken) {
              token.token = backendAccessToken;
              token.refreshToken = backendRefreshToken;
              token.nickname = backendNickname;
              token.user_id = backendUserId;
            } else {
              logger.error("❌ 소셜 로그인 토큰 누락 (jwt):", {
                provider: account.provider,
              });
              throw new Error("SOCIAL_LOGIN_FAILED");
            }
          } catch (error) {
            // 백엔드 API 실패 시 에러 로깅만 수행
            logger.error("❌ 소셜 로그인 백엔드 API 실패:", error);
            // 토큰 없이 진행 (인증 실패로 처리됨)
            throw error;
          }
        } else {
          token.token = (user as { token?: string }).token; // Credentials 로그인의 경우
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.user_id = token.user_id as string; // 실제 DB 사용자 ID
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.nickname = token.nickname as string;
        (session as { token?: string }).token = token.token; // 토큰을 세션에 포함
        (session as { accessToken?: string }).accessToken =
          token.accessToken as string; // accessToken도 포함
        (session as { refreshToken?: string }).refreshToken =
          token.refreshToken as string; // refreshToken도 포함
        (
          session as { shouldSaveToLocalStorage?: boolean }
        ).shouldSaveToLocalStorage = true; // localStorage 저장 플래그
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET, // ✨ 이 부분이 .env.local과 연결됩니다.
  debug: process.env.NODE_ENV === "development",
  // JWT 에러 핸들링
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  // 세션 에러 핸들링
  events: {},
  // 에러 페이지 설정
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
