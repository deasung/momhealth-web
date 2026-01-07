// lib/env.ts
// Next.js standalone 모드에서 런타임 환경 변수를 읽기 위한 헬퍼 함수

/**
 * 런타임 환경 변수를 안전하게 읽는 함수
 * Next.js가 빌드 시점에 최적화하면서 환경 변수를 제거하는 것을 방지하기 위해
 * 런타임에 명시적으로 process.env를 참조합니다.
 */
export function getEnvVar(key: string): string | undefined {
    // Node.js 환경인지 확인
    if (typeof process === "undefined") {
        console.error(`[env.ts] process가 정의되지 않음: ${key}`);
        return undefined;
    }

    if (!process.env) {
        console.error(`[env.ts] process.env가 정의되지 않음: ${key}`);
        return undefined;
    }

    // 런타임에 명시적으로 process.env를 참조
    // 여러 방법으로 시도하여 Next.js 최적화를 우회
    const value =
        process.env[key] ||
        process.env[`${key}`] ||
        (process.env as Record<string, string | undefined>)[key];

    // 디버깅: 환경 변수가 없을 때만 로그 (너무 많은 로그 방지)
    if (!value && (key === "MOMHEALTH_API_URL" || key === "MOMHEALTH_API_KEY")) {
        console.warn(`[env.ts] 환경 변수 누락: ${key}`, {
            allKeys: Object.keys(process.env).filter((k) => k.includes("MOMHEALTH")),
            nodeEnv: process.env.NODE_ENV,
        });
    }

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
// EC2/Docker 런타임에서 환경 변수를 읽기 위해 단일화된 getEnvVar 함수를 사용
export const env = {
    // --- MOMHEALTH 환경 변수를 getEnvVar로 통일 ---
    MOMHEALTH_API_URL: () => getEnvVar("MOMHEALTH_API_URL"),
    MOMHEALTH_API_KEY: () => getEnvVar("MOMHEALTH_API_KEY"),

    // 나머지 변수들은 기존과 같이 getEnvVar를 사용
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