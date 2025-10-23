import axios from "axios";
import { TOKEN_KEYS, API_CONFIG } from "./constants";

export const BASE_URL = process.env.MOMHEATH_API_URL || "http://localhost:3000";
export const API_KEY =
  process.env.MOMHEATH_API_KEY || "f5e60c40-5eb4-11ea-b4d7-0d9c1606f185";

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
  timeout: API_CONFIG.TIMEOUT,
});

// 요청 인터셉터: 인증 토큰 추가 + 로깅
api.interceptors.request.use(
  async (config) => {
    let { currentToken, isGuest } = {
      currentToken: getCurrentToken(),
      isGuest: getIsGuest(),
    };

    // 토큰이 없거나 만료된 경우 게스트 토큰 자동 발급
    if (
      (!currentToken || (currentToken && isTokenExpired(currentToken))) &&
      !isGuest
    ) {
      console.log(
        "🔄 [요청 인터셉터] 토큰이 없거나 만료되어 게스트 토큰 자동 발급 시도"
      );
      try {
        const guestToken = await getGuestToken();
        if (guestToken) {
          setToken(guestToken, true);
          currentToken = guestToken;
          console.log("✅ 게스트 토큰 자동 발급 성공");
        }
      } catch (error) {
        console.log("❌ 게스트 토큰 자동 발급 실패:", error);
      }
    }

    // 토큰이 있으면 Authorization 헤더에 추가
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }

    console.log("API 요청:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ""}${config.url}`,
      hasToken: !!currentToken,
      isGuest: isGuest,
      headers: config.headers,
    });

    return config;
  },
  (error) => {
    console.error("API 요청 설정 오류:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 처리 + 에러 처리
api.interceptors.response.use(
  (response) => {
    console.log("API 응답 성공:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized 에러이고, 아직 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("🔑 토큰 만료 감지, 게스트 토큰으로 재시도");

      try {
        // 게스트 토큰 발급
        const guestToken = await getGuestToken();
        if (guestToken) {
          setToken(guestToken, true);

          // 원래 요청에 새 토큰 적용
          originalRequest.headers.Authorization = `Bearer ${guestToken}`;

          // 원래 요청 재시도
          return api(originalRequest);
        }
      } catch (retryError) {
        console.error("토큰 갱신 후 재시도 실패:", retryError);
      }
    }

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

// 게스트 토큰 발급
export const getGuestToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/public/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "x-api-key": API_KEY }),
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

export default api;
