import axios from "axios";

export const BASE_URL = process.env.MOMHEATH_API_URL || "";
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
  BASE_URL: BASE_URL || "상대 경로 사용",
  API_KEY: API_KEY ? "설정됨" : "설정되지 않음",
  NODE_ENV: process.env.NODE_ENV,
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

// 요청 인터셉터로 요청 로그 추가
api.interceptors.request.use(
  (config) => {
    console.log("API 요청:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ""}${config.url}`,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error("API 요청 설정 오류:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터로 에러 처리 개선
api.interceptors.response.use(
  (response) => {
    console.log("API 응답 성공:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
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
