// 토큰 관련 localStorage 키 상수
export const TOKEN_KEYS = {
  TOKEN: "momhealth_token",
  IS_GUEST: "momhealth_is_guest",
} as const;

// API 관련 상수
export const API_CONFIG = {
  TIMEOUT: 10000, // 10초
  RETRY_ATTEMPTS: 3,
  TOKEN_REFRESH_THRESHOLD: 10 * 60, // 10분 (초 단위)
} as const;
