// lib/env.ts
// Next.js standalone 모드에서 런타임 환경 변수를 읽기 위한 헬퍼 함수

/**
 * 런타임 환경 변수를 안전하게 읽는 함수
 * Next.js가 빌드 시점에 최적화하면서 환경 변수를 제거하는 것을 방지하기 위해
 * 런타임에 명시적으로 process.env를 참조합니다.
 */
export function getEnvVar(key: string): string | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  // 런타임에 명시적으로 process.env를 참조
  const value = process.env[key];
  return value;
}

/**
 * 필수 환경 변수를 읽고, 없으면 에러를 던집니다.
 */
export function getRequiredEnvVar(key: string): string {
  const value = getEnvVar(key);
  if (!value) {
    throw new Error(`필수 환경 변수가 설정되지 않았습니다: ${key}`);
  }
  return value;
}

// 환경 변수 접근 헬퍼
export const env = {
  MOMHEALTH_API_URL: () => getEnvVar("MOMHEALTH_API_URL"),
  MOMHEALTH_API_KEY: () => getEnvVar("MOMHEALTH_API_KEY"),
  NEXTAUTH_URL: () => getEnvVar("NEXTAUTH_URL"),
  NEXTAUTH_SECRET: () => getEnvVar("NEXTAUTH_SECRET"),
  JWT_SECRET: () => getEnvVar("JWT_SECRET"),
  CDN_URL: () => getEnvVar("CDN_URL"),
  KAKAO_CLIENT_ID: () => getEnvVar("KAKAO_CLIENT_ID"),
  KAKAO_CLIENT_SECRET: () => getEnvVar("KAKAO_CLIENT_SECRET"),
  GOOGLE_CLIENT_ID: () => getEnvVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: () => getEnvVar("GOOGLE_CLIENT_SECRET"),
  NODE_ENV: () => getEnvVar("NODE_ENV") || "production",
};
