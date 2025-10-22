import axios from "axios";

export const BASE_URL =
    process.env.MOMHEATH_API_URL || "http://localhost:3000";
export const API_KEY = process.env.MOMHEATH_API_KEY || "";

// 환경 변수 검증
if (!process.env.MOMHEATH_API_URL) {
    console.warn(
        "⚠️ MOMHEATH_API_URL 환경 변수가 설정되지 않았습니다. 기본값 http://localhost:8080을 사용합니다."
    );
}

if (!process.env.MOMHEATH_API_KEY) {
    console.warn("⚠️ MOMHEATH_ADMIN_API_KEY 환경 변수가 설정되지 않았습니다.");
}

console.log("API 설정:", {
    BASE_URL,
    API_KEY: API_KEY ? "설정됨" : "설정되지 않음",
});

// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "x-api-key": API_KEY }),
    },
    timeout: 10000, // 10초 타임아웃 설정
});

// 응답 인터셉터로 에러 처리 개선
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API 요청 실패:", {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        return Promise.reject(error);
    }
);

export default api;
