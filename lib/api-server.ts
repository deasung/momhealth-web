/**
 * 서버 사이드 API 유틸리티
 * Server Components에서 사용하는 API 함수들
 */

import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

const API_KEY = "f5e60c40-5eb4-11ea-b4d7-0d9c1606f185";
const BASE_URL = process.env.MOMHEALTH_API_URL;

if (!BASE_URL) {
  console.warn("⚠️ MOMHEALTH_API_URL 환경변수가 설정되지 않았습니다.");
}

// 서버용 axios 인스턴스 생성
const createServerApi = (token?: string | null) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };

  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("✅ [createServerApi] Authorization 헤더 추가됨");
  } else {
    console.warn(
      "⚠️ [createServerApi] 토큰이 없어 Authorization 헤더가 추가되지 않습니다."
    );
  }

  return axios.create({
    baseURL: BASE_URL,
    headers,
    timeout: 10000,
  });
};

/**
 * 홈 데이터 가져오기 (공개 API)
 */
export async function getHomeDataServer() {
  try {
    const api = createServerApi();
    const response = await api.get("/public/home");
    return response.data;
  } catch (error) {
    console.error("홈 데이터 가져오기 실패:", error);
    throw error;
  }
}

/**
 * 건강 질문 목록 가져오기 (인증 필요)
 * 401 에러 발생 시 refresh_token으로 자동 갱신 후 재시도
 */
export async function getHealthQuestionsServer(
  limit: number = 10,
  cursor?: string,
  token?: string | null,
  refreshToken?: string | null
) {
  // 토큰이 없으면 토큰 가져오기 시도
  let accessToken = token;
  let currentRefreshToken = refreshToken;

  try {
    // 디버깅: 토큰 전달 확인
    console.log("🔐 [getHealthQuestionsServer] 토큰 전달 상태:", {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "null",
      limit,
      cursor: cursor || "없음",
    });

    if (!accessToken) {
      const tokens = await getServerTokens();
      accessToken = tokens.accessToken;
      currentRefreshToken = tokens.refreshToken || currentRefreshToken;
    }

    if (!accessToken) {
      console.warn(
        "⚠️ [getHealthQuestionsServer] 토큰을 가져올 수 없습니다. 401 에러가 발생할 수 있습니다."
      );
    }

    const api = createServerApi(accessToken);
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await api.get(
      `/private/health.questions?${params.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as {
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
    };

    // 401 에러이고 refresh_token이 있으면 토큰 갱신 후 재시도
    if (axiosError.response?.status === 401 && currentRefreshToken) {
      console.log(
        "🔄 [getHealthQuestionsServer] 401 에러 발생, refresh_token으로 토큰 갱신 시도"
      );

      try {
        const newTokens = await refreshAccessToken(currentRefreshToken);
        if (newTokens) {
          console.log("✅ [getHealthQuestionsServer] 토큰 갱신 성공, 재시도");

          // 갱신된 토큰으로 재시도
          const api = createServerApi(newTokens.accessToken);
          const params = new URLSearchParams();
          params.append("limit", limit.toString());
          if (cursor) {
            params.append("cursor", cursor);
          }

          const retryResponse = await api.get(
            `/private/health.questions?${params.toString()}`
          );
          return retryResponse.data;
        }
      } catch (refreshError) {
        console.error(
          "❌ [getHealthQuestionsServer] 토큰 갱신 실패:",
          refreshError
        );
      }
    }

    console.error("❌ [getHealthQuestionsServer] 질문목록 가져오기 실패:", {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
    });
    throw error;
  }
}

/**
 * 건강 질문 상세 가져오기 (인증 필요)
 */
export async function getHealthQuestionDetailServer(
  id: string,
  token?: string | null
) {
  try {
    const api = createServerApi(token);
    const response = await api.get(`/private/health.questions/${id}`);
    return response.data;
  } catch (error) {
    console.error("질문 상세 가져오기 실패:", error);
    throw error;
  }
}

/**
 * 퀴즈 진행 상태 리셋 (인증 필요)
 */
export async function resetQuizProgressServer(
  id: string,
  token?: string | null
) {
  try {
    const api = createServerApi(token);
    const response = await api.post(`/private/health.questions/${id}/reset`);
    return response.data;
  } catch (error) {
    console.error("퀴즈 리셋 실패:", error);
    throw error;
  }
}

/**
 * 커뮤니티 게시글 목록 가져오기 (인증 필요)
 */
export async function getCommunityPostsServer(
  limit: number = 10,
  cursor?: string,
  token?: string | null
) {
  try {
    const api = createServerApi(token);
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await api.get(`/private/community?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("커뮤니티 게시글 로딩 실패:", error);
    throw error;
  }
}

/**
 * 커뮤니티 게시글 상세 가져오기 (인증 필요)
 */
export async function getCommunityPostDetailServer(
  postId: string,
  token?: string | null
) {
  try {
    const api = createServerApi(token);
    const response = await api.get(`/private/community/${postId}`);
    return response.data;
  } catch (error) {
    console.error("커뮤니티 게시글 상세 로딩 실패:", error);
    throw error;
  }
}

/**
 * 개인정보 처리방침 가져오기 (공개 API)
 */
export async function getPrivacyPolicyServer() {
  try {
    const api = createServerApi();
    const response = await api.get("/public/policy/privacy");
    return response.data;
  } catch (error) {
    console.error("개인정보 처리방침 조회 실패:", error);
    throw error;
  }
}

/**
 * 서비스 이용약관 가져오기 (공개 API)
 */
export async function getServiceTermsServer() {
  try {
    const api = createServerApi();
    const response = await api.get("/public/policy/terms");
    return response.data;
  } catch (error) {
    console.error("서비스 이용약관 조회 실패:", error);
    throw error;
  }
}

/**
 * 사용자의 완료한 건강 질문 조회 (인증 필요)
 */
export async function getUserCompletedQuestionsServer(
  params: {
    userId: string;
    page?: number;
    limit?: number;
  },
  token?: string | null
) {
  try {
    const api = createServerApi(token);
    const response = await api.get("/private/health.questions/user/completed", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("사용자의 완료한 건강 질문 조회 실패:", error);
    throw error;
  }
}

/**
 * 공지사항 목록 가져오기 (공개 API)
 */
export async function getNoticesServer(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  try {
    const api = createServerApi();
    const response = await api.get("/public/notice/list", { params });
    return response.data;
  } catch (error) {
    console.error("공지사항 목록 가져오기 실패:", error);
    throw error;
  }
}

/**
 * 공지사항 상세 가져오기 (공개 API)
 */
export async function getNoticeDetailServer(id: string) {
  try {
    const api = createServerApi();
    const response = await api.get(`/public/notice/${id}`);
    return response.data;
  } catch (error) {
    console.error("공지사항 상세 가져오기 실패:", error);
    throw error;
  }
}

/**
 * 매핑된 사용자 목록 조회 (친구 목록, 인증 필요)
 */
export async function getMappedUsersServer(token?: string | null) {
  try {
    const api = createServerApi(token);
    const response = await api.get("/private/register/mapped-users");
    return response.data;
  } catch (error) {
    console.error("매핑된 사용자 목록 조회 실패:", error);
    throw error;
  }
}

/**
 * 친구 요청 카운트 조회 (인증 필요)
 */
export async function getFriendRequestCountsServer(token?: string | null) {
  try {
    const api = createServerApi(token);
    const response = await api.get("/private/register/friend-requests");
    return response.data;
  } catch (error) {
    console.error("친구 요청 카운트 조회 실패:", error);
    throw error;
  }
}

/**
 * 문의 목록 가져오기 (인증 필요)
 */
export async function getInquiriesServer(
  params?: {
    limit?: number;
    cursor?: string;
  },
  token?: string | null
) {
  try {
    const api = createServerApi(token);
    const response = await api.get("/private/inquiry", {
      params: {
        limit: params?.limit || 10,
        cursor: params?.cursor,
      },
    });
    return response.data;
  } catch (error) {
    console.error("문의 목록 가져오기 실패:", error);
    throw error;
  }
}

/**
 * 문의 상세 가져오기 (인증 필요)
 */
export async function getInquiryDetailServer(
  id: number,
  token?: string | null
) {
  try {
    const api = createServerApi(token);
    const response = await api.get(`/private/inquiry/${id}`);
    return response.data;
  } catch (error) {
    console.error("문의 상세 가져오기 실패:", error);
    throw error;
  }
}

/**
 * NextAuth 세션에서 토큰 가져오기
 */
export async function getServerToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.warn("⚠️ [getServerToken] 세션이 없습니다.");
      return null;
    }

    // NextAuth 세션에서 토큰 추출
    const typedSession = session as {
      token?: string | null;
      accessToken?: string | null;
    };
    const token = typedSession.token || typedSession.accessToken || null;

    // 디버깅: 토큰 상태 로그
    console.log("🔐 [getServerToken] 토큰 상태:", {
      hasSession: !!session,
      hasToken: !!typedSession.token,
      hasAccessToken: !!typedSession.accessToken,
      finalToken: token ? `${token.substring(0, 20)}...` : null,
    });

    if (!token) {
      console.warn("⚠️ [getServerToken] 세션에는 있지만 토큰이 없습니다.");
    }

    return token;
  } catch (error) {
    console.error("❌ [getServerToken] 서버 토큰 가져오기 실패:", error);
    return null;
  }
}

/**
 * NextAuth 세션에서 refresh_token 가져오기
 */
export async function getServerRefreshToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const typedSession = session as {
      refreshToken?: string | null;
    };
    return typedSession.refreshToken || null;
  } catch (error) {
    console.error(
      "❌ [getServerRefreshToken] refresh_token 가져오기 실패:",
      error
    );
    return null;
  }
}

/**
 * 게스트 토큰 발급 (비로그인 사용자용)
 */
export async function getGuestToken(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const api = createServerApi();
    const response = await api.post("/public/auth/token", {});

    if (response.data?.access_token && response.data?.refresh_token) {
      console.log("✅ [getGuestToken] 게스트 토큰 발급 성공");
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    }
    return null;
  } catch (error) {
    console.error("❌ [getGuestToken] 게스트 토큰 발급 실패:", error);
    return null;
  }
}

/**
 * refresh_token으로 access_token 갱신
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const api = createServerApi();
    const response = await api.post("/public/auth/token/refresh", {
      refresh_token: refreshToken,
    });

    if (response.data?.access_token && response.data?.refresh_token) {
      console.log("✅ [refreshAccessToken] 토큰 갱신 성공");
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    }
    return null;
  } catch (error) {
    console.error("❌ [refreshAccessToken] 토큰 갱신 실패:", error);
    return null;
  }
}

/**
 * 토큰과 refresh_token을 함께 가져오기 (세션 또는 게스트 토큰)
 */
export async function getServerTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  // 먼저 세션에서 토큰 확인
  const sessionToken = await getServerToken();
  const sessionRefreshToken = await getServerRefreshToken();

  if (sessionToken && sessionRefreshToken) {
    return {
      accessToken: sessionToken,
      refreshToken: sessionRefreshToken,
    };
  }

  // 세션에 토큰이 없으면 게스트 토큰 발급
  if (!sessionToken) {
    console.log("🔐 [getServerTokens] 세션 토큰이 없어 게스트 토큰 발급 시도");
    const guestTokens = await getGuestToken();
    if (guestTokens) {
      return {
        accessToken: guestTokens.accessToken,
        refreshToken: guestTokens.refreshToken,
      };
    }
  }

  return {
    accessToken: sessionToken,
    refreshToken: sessionRefreshToken,
  };
}
