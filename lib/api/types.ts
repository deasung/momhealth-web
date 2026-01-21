/**
 * 공통 API 타입 정의
 * Client와 Server API 레이어에서 공유하는 타입
 */

/**
 * API 응답 기본 구조
 */
export interface ApiResponse<T = any> {
  data: T;
  status?: number;
  message?: string;
}

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  limit?: number;
  cursor?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 정렬 파라미터
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * 토큰 정보
 */
export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
}

/**
 * 게스트 토큰 응답
 */
export interface GuestTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

/**
 * Refresh 토큰 응답
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * 헬스 퀘스천 조회 옵션
 */
export interface HealthQuestionOptions {
  includeAnswered?: boolean;
  categoryIds?: string[];
}

/**
 * 커뮤니티 게시글 조회 파라미터
 */
export interface CommunityPostsParams extends PaginationParams {
  categoryId?: string;
}

/**
 * 유저 완료 퀘스천 조회 파라미터
 */
export interface UserCompletedQuestionsParams extends PaginationParams {
  userId: string;
}

/**
 * 친구 퀘스천 결과 조회 파라미터
 */
export interface FriendQuestionResultParams {
  questionId: string;
  targetUserId: string;
}

/**
 * 공지사항 조회 파라미터
 */
export interface NoticesParams extends PaginationParams, SortParams {}

/**
 * 문의 내역 조회 파라미터
 */
export interface InquiriesParams extends PaginationParams {}
