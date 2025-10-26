import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";
import api from "@/lib/api";

// 타입 정의
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
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
  }
}

// 환경 변수 확인 로그
console.log("NextAuth 환경 변수:", {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID ? "설정됨" : "설정되지 않음",
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET
    ? "설정됨"
    : "설정되지 않음",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "설정됨" : "설정되지 않음",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
    ? "설정됨"
    : "설정되지 않음",
});

// 환경별 콜백 URL 로깅
const callbackUrls = {
  kakao: `${process.env.NEXTAUTH_URL}/api/auth/callback/kakao`,
  google: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
};
console.log("OAuth 콜백 URL:", callbackUrls);

export default NextAuth({
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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 실제 서버 API 호출
          console.log("NextAuth에서 API 호출 시도:", {
            email: credentials.email,
            url: "/public/auth/token/login",
          });

          const response = await api.post("/public/auth/token/login", {
            email: credentials.email,
            password: credentials.password,
          });

          if (response.status !== 200) {
            console.error("Login API error:", response.data?.message);
            return null;
          }

          const data = response.data;

          if (!data.success || !data.access_token) {
            return null;
          }

          return {
            id: data.user?.id?.toString() || "1",
            name: data.user?.nickname || credentials.email,
            email: credentials.email,
            nickname: data.user?.nickname,
            token: data.access_token,
          };
        } catch (error: unknown) {
          console.error("Error during authentication:", error);

          // API 에러 응답 처리
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as {
              response: { status: number; data?: { message?: string } };
            };
            const status = axiosError.response.status;
            const message =
              axiosError.response.data?.message ||
              "로그인 API 오류가 발생했습니다.";
            console.error("Login API error:", message);
          }

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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.nickname = (user as { nickname?: string }).nickname;
        token.accessToken = (user as { token?: string }).token;

        // 소셜 로그인인 경우 백엔드 API 호출
        if (account?.provider === "kakao" || account?.provider === "google") {
          try {
            console.log("소셜 로그인 백엔드 API 호출:", {
              provider: account.provider,
              user: user.email,
            });

            const response = await api.post("/public/auth/social-login", {
              provider: account.provider,
              email: user.email,
              name: user.name,
              // 소셜 로그인에서 받은 추가 정보들
              socialId: user.id,
            });

            if (response.data.success) {
              // 백엔드에서 받은 토큰 사용
              token.token = response.data.access_token;
              token.refreshToken = response.data.refresh_token;
              token.nickname = response.data.user?.nickname;
            } else {
              throw new Error(response.data.message || "소셜 로그인 실패");
            }
          } catch (error) {
            console.error("소셜 로그인 API 호출 실패:", error);
            // 백엔드 API 실패 시 로컬 JWT 토큰 생성
            const { generateToken } = await import("@/lib/auth");
            token.token = generateToken({
              id: user.id,
              email: user.email || "",
            });
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
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.nickname = token.nickname as string;
        (session as { token?: string }).token = token.token; // 토큰을 세션에 포함
        (session as { accessToken?: string }).accessToken =
          token.accessToken as string; // accessToken도 포함
        (
          session as { shouldSaveToLocalStorage?: boolean }
        ).shouldSaveToLocalStorage = true; // localStorage 저장 플래그
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("NextAuth redirect 콜백:", {
        url,
        baseUrl,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      });

      // 상대 경로인 경우 NEXTAUTH_URL 사용
      if (url.startsWith("/")) {
        const redirectUrl = `${process.env.NEXTAUTH_URL}${url}`;
        console.log("상대 경로 리다이렉트:", redirectUrl);
        return redirectUrl;
      }

      // 절대 URL인 경우 같은 origin인지 확인
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(process.env.NEXTAUTH_URL || baseUrl);

        if (urlObj.origin === baseUrlObj.origin) {
          console.log("같은 origin 리다이렉트:", url);
          return url;
        }
      } catch (error) {
        console.error("URL 파싱 오류:", error);
      }

      // 기본값으로 NEXTAUTH_URL 사용
      const defaultUrl = process.env.NEXTAUTH_URL || baseUrl;
      console.log("기본 리다이렉트:", defaultUrl);
      return defaultUrl;
    },
  },
  pages: {
    signIn: "/login", // 로그인 페이지 경로
  },
  secret: process.env.NEXTAUTH_SECRET, // ✨ 이 부분이 .env.local과 연결됩니다.
  debug: process.env.NODE_ENV === "development",
  // JWT 에러 핸들링
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  // 세션 에러 핸들링
  events: {
    async signOut({ token }) {
      console.log("NextAuth signOut event:", token);
    },
    async signIn({ user, account, profile, isNewUser }) {
      console.log("NextAuth signIn event:", {
        user: user.email,
        provider: account?.provider,
      });
    },
  },
});
