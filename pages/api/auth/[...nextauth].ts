import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
  }
}

export default NextAuth({
  providers: [
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
        } catch (error: any) {
          console.error("Error during authentication:", error);

          // API 에러 응답 처리
          if (error.response) {
            const status = error.response.status;
            const message =
              error.response.data?.message || "로그인 API 오류가 발생했습니다.";
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.nickname = (user as any).nickname;
        token.token = (user as any).token; // 토큰 저장
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.nickname = token.nickname as string;
        (session as any).token = token.token; // 토큰을 세션에 포함
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // 로그인 페이지 경로
  },
  secret: process.env.NEXTAUTH_SECRET, // ✨ 이 부분이 .env.local과 연결됩니다.
  debug: process.env.NODE_ENV === "development",
});
