// lib/config.ts

// 필수 환경변수 체크
if (!process.env.MOMHEALTH_API_URL) {
  throw new Error('Missing MOMHEALTH_API_URL in env');
}
if (!process.env.MOMHEALTH_API_KEY) {
  throw new Error('Missing MOMHEALTH_API_KEY in env');
}

/**
 * Next.js 서버/빌드 시점에만 읽히는 변수들입니다.
 * 클라이언트 번들에는 포함되지 않아요.
 */
export const BACKEND = process.env.MOMHEALTH_API_URL;
export const API_KEY = process.env.MOMHEALTH_API_KEY;
