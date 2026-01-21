/**
 * 공통 API 유틸리티 함수
 * Client와 Server API 레이어에서 공유하는 로직
 */

import { TokenInfo, GuestTokenResponse } from "./types";

/**
 * JWT 토큰 만료 시간 확인
 * @param token JWT 토큰
 * @returns 만료 여부 (true: 만료됨, false: 유효함)
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

/**
 * 쿼리 파라미터를 URLSearchParams로 변환
 * undefined 값은 제외됨
 */
export const buildQueryParams = (
  params: Record<string, any>
): URLSearchParams => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams;
};

/**
 * API 엔드포인트 생성 헬퍼
 */
export const buildEndpoint = (
  path: string,
  params?: Record<string, any>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return path;
  }

  const queryString = buildQueryParams(params).toString();
  return queryString ? `${path}?${queryString}` : path;
};

/**
 * API 에러 메시지 추출
 */
export const extractErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
};

/**
 * 게스트 토큰 발급 공통 로직
 * 클라이언트와 서버에서 다른 HTTP 클라이언트를 사용하므로
 * 각각 구현은 다르지만 응답 형태는 통일
 */
export const parseGuestTokenResponse = (
  response: GuestTokenResponse
): TokenInfo | null => {
  if (response.access_token && response.refresh_token) {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    };
  }
  return null;
};

/**
 * Bearer 토큰 형식 생성
 */
export const formatBearerToken = (token: string): string => {
  if (token.startsWith("Bearer ")) {
    return token;
  }
  return `Bearer ${token}`;
};

/**
 * Bearer 토큰에서 순수 토큰 추출
 */
export const extractToken = (bearerToken: string): string => {
  if (bearerToken.startsWith("Bearer ")) {
    return bearerToken.substring(7);
  }
  return bearerToken;
};

/**
 * 환경 변수 검증
 */
export const validateEnvVar = (
  varName: string,
  value: string | undefined
): string => {
  if (!value) {
    throw new Error(`환경 변수 ${varName}가 설정되지 않았습니다.`);
  }
  return value;
};

/**
 * API 응답 타입 가드
 */
export const isApiError = (error: any): error is { response: any } => {
  return error && error.response !== undefined;
};

/**
 * 401 에러 여부 확인
 */
export const is401Error = (error: any): boolean => {
  return isApiError(error) && error.response?.status === 401;
};

/**
 * 페이지네이션 파라미터 정규화
 */
export const normalizePaginationParams = (params?: {
  limit?: number;
  cursor?: string;
  page?: number;
  pageSize?: number;
}): Record<string, any> => {
  if (!params) return {};

  const normalized: Record<string, any> = {};

  if (params.limit !== undefined) normalized.limit = params.limit;
  if (params.cursor !== undefined) normalized.cursor = params.cursor;
  if (params.page !== undefined) normalized.page = params.page;
  if (params.pageSize !== undefined) normalized.pageSize = params.pageSize;

  return normalized;
};
