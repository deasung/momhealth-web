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
 */
export async function getHealthQuestionsServer(
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

    const response = await api.get(
      `/private/health.questions?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("질문목록 가져오기 실패:", error);
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
 * NextAuth 세션에서 토큰 가져오기
 */
export async function getServerToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    // NextAuth 세션에서 토큰 추출
    const token =
      (session as any)?.token || (session as any)?.accessToken || null;
    return token;
  } catch (error) {
    console.error("서버 토큰 가져오기 실패:", error);
    return null;
  }
}
