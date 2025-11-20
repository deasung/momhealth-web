import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

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

// 환경 변수는 .env에서 주입됨

// 서버 시작 시 환경 변수 확인 (모듈 로드 시점에 실행)
if (typeof process !== "undefined") {
  const baseURL = process.env.MOMHEALTH_API_URL;
  const apiKey = process.env.MOMHEALTH_API_KEY;

  if (!baseURL || !apiKey) {
    console.error("❌ [NextAuth] 환경변수 누락 (서버 시작 시):", {
      MOMHEALTH_API_URL: baseURL || "undefined",
      MOMHEALTH_API_KEY: apiKey ? "설정됨" : "undefined",
      nodeEnv: process.env.NODE_ENV,
    });
  } else {
    console.log("✅ [NextAuth] 환경변수 확인 완료:", {
      MOMHEALTH_API_URL: baseURL ? "설정됨" : "누락",
      MOMHEALTH_API_KEY: apiKey ? "설정됨" : "누락",
      nodeEnv: process.env.NODE_ENV,
    });
  }
}

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 서버 사이드에서 백엔드 절대 URL로 직접 호출 (프록시, 인터셉터 우회)
          const baseURL = process.env.MOMHEALTH_API_URL;
          const apiKey = process.env.MOMHEALTH_API_KEY;

          if (!baseURL || !apiKey) {
            console.error("❌ 환경변수 누락:", {
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
            name: string;
            email: string;
            nickname?: string;
            token?: string;
            refreshToken?: string;
          } = {
            id: data.user?.id?.toString() || "1",
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.nickname = (user as { nickname?: string }).nickname;
        token.token = (user as { token?: string }).token;
        token.accessToken = (user as { token?: string }).token;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;

        // 소셜 로그인인 경우 백엔드 API 호출
        if (account?.provider === "kakao" || account?.provider === "google") {
          try {
            // 서버 사이드에서 직접 백엔드 API 호출
            const apiKey = process.env.MOMHEALTH_API_KEY;
            const baseURL = process.env.MOMHEALTH_API_URL;

            if (!baseURL || !apiKey) {
              console.error("❌ 환경변수 누락 (소셜 로그인):", {
                MOMHEALTH_API_URL: baseURL ? "설정됨" : "누락",
                MOMHEALTH_API_KEY: apiKey ? "설정됨" : "누락",
              });
              throw new Error("환경변수가 설정되지 않았습니다.");
            }

            const response = await axios.post(
              `${baseURL}/public/auth/social-login`,
              {
                provider: account.provider,
                email: user.email,
                name: user.name,
                socialId: user.id,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": apiKey,
                },
              }
            );

            if (response.data.success) {
              // 백엔드에서 받은 토큰 사용
              token.token = response.data.access_token;
              token.refreshToken = response.data.refresh_token;
              token.nickname = response.data.user?.nickname;
            } else {
              throw new Error(response.data.message || "소셜 로그인 실패");
            }
          } catch (error) {
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
        (session as { refreshToken?: string }).refreshToken =
          token.refreshToken as string; // refreshToken도 포함
        (
          session as { shouldSaveToLocalStorage?: boolean }
        ).shouldSaveToLocalStorage = true; // localStorage 저장 플래그
      }
      return session;
    },
    // async redirect({ url, baseUrl }) {
    //   console.log("NextAuth redirect 콜백:", {
    //     url,
    //     baseUrl,
    //     NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    //   });

    //   // 상대 경로인 경우 NEXTAUTH_URL 사용
    //   if (url.startsWith("/")) {
    //     const redirectUrl = `${process.env.NEXTAUTH_URL}${url}`;
    //     console.log("상대 경로 리다이렉트:", redirectUrl);
    //     return redirectUrl;
    //   }

    //   // 절대 URL인 경우 같은 origin인지 확인
    //   try {
    //     const urlObj = new URL(url);
    //     const baseUrlObj = new URL(process.env.NEXTAUTH_URL || baseUrl);

    //     if (urlObj.origin === baseUrlObj.origin) {
    //       console.log("같은 origin 리다이렉트:", url);
    //       return url;
    //     }
    //   } catch (error) {
    //     console.error("URL 파싱 오류:", error);
    //   }

    //   // 기본값으로 NEXTAUTH_URL 사용
    //   const defaultUrl = process.env.NEXTAUTH_URL || baseUrl;
    //   console.log("기본 리다이렉트:", defaultUrl);
    //   return defaultUrl;
    // },
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
});
