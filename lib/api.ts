import axios from "axios";
import { TOKEN_KEYS, API_CONFIG } from "./constants";

// 클라이언트에서는 Next.js API 라우트를 통해 프록시
export const BASE_URL = "/api/proxy";
export const API_KEY = "f5e60c40-5eb4-11ea-b4d7-0d9c1606f185";

// 토큰 관리 상태
let currentToken: string | null = null;
let isGuest: boolean = false;

// localStorage에서 토큰 초기화
const initializeTokenFromStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEYS.TOKEN);
      const storedIsGuest = localStorage.getItem(TOKEN_KEYS.IS_GUEST);

      if (storedToken) {
        currentToken = storedToken;
        isGuest = storedIsGuest === "true";
        console.log("🔄 localStorage에서 토큰 복원:", {
          hasToken: !!storedToken,
          isGuest: storedIsGuest === "true",
        });
      }
    } catch (error) {
      console.error("토큰 복원 실패:", error);
    }
  }
};

// 초기화 실행
initializeTokenFromStorage();

// JWT 토큰 만료 시간 확인
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error("토큰 파싱 실패:", error);
    return true; // 파싱 실패 시 만료된 것으로 간주
  }
};

// 토큰 관리 함수들
export const setToken = (token: string | null, guest: boolean = false) => {
  currentToken = token;
  isGuest = guest;

  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEYS.TOKEN, token);
        localStorage.setItem(TOKEN_KEYS.IS_GUEST, guest.toString());
      } else {
        localStorage.removeItem(TOKEN_KEYS.TOKEN);
        localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
      }
    } catch (error) {
      console.error("토큰 저장 실패:", error);
    }
  }

  console.log("🔑 토큰 설정:", { hasToken: !!token, isGuest: guest });
};

export const getCurrentToken = () => currentToken;
export const getIsGuest = () => isGuest;

export const clearToken = () => {
  currentToken = null;
  isGuest = false;

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(TOKEN_KEYS.TOKEN);
      localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
    } catch (error) {
      console.error("토큰 삭제 실패:", error);
    }
  }

  console.log("🗑️ 토큰 초기화");
};


// axios 인스턴스 생성
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY && { "x-api-key": API_KEY }),
  },
  timeout: API_CONFIG.TIMEOUT,
});

// 요청 인터셉터: localStorage 토큰을 프록시로 전달
api.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰 가져오기
    const currentToken = getCurrentToken();

    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }

    console.log("API 요청 (프록시):", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ""}${config.url}`,
      hasToken: !!currentToken,
      isGuest: getIsGuest(),
    });

    return config;
  },
  (error) => {
    console.error("API 요청 설정 오류:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 프록시를 통한 응답 로깅만
api.interceptors.response.use(
  (response) => {
    console.log("API 응답 성공 (프록시):", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error("API 요청 실패 (프록시):", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// 게스트 토큰 발급 (프록시를 통해)
export const getGuestToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/public/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token || null;
    }
    return null;
  } catch (error) {
    console.error("게스트 토큰 발급 실패:", error);
    return null;
  }
};

// 홈 데이터 가져오기
export const getHomeData = async () => {
  try {
    const response = await api.get("/public/home");
    return response.data;
  } catch (error) {
    console.error("홈 데이터 가져오기 실패:", error);
    throw error;
  }
};

// 질문목록 가져오기 (커서 기반 페이징)
export const getHealthQuestions = async (
  limit: number = 10,
  cursor?: string
) => {
  try {
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
};

export default api;
