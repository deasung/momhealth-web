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
export const setToken = (
  token: string | null,
  guest: boolean = false,
  refreshToken?: string | null
) => {
  currentToken = token;
  isGuest = guest;

  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEYS.TOKEN, token);
        localStorage.setItem(TOKEN_KEYS.IS_GUEST, guest.toString());

        // refresh token도 저장
        if (refreshToken) {
          localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
        } else {
          localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
        }
      } else {
        localStorage.removeItem(TOKEN_KEYS.TOKEN);
        localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      }
    } catch (error) {
      console.error("토큰 저장 실패:", error);
    }
  }

  console.log("🔑 토큰 설정:", {
    hasToken: !!token,
    isGuest: guest,
    hasRefreshToken: !!refreshToken,
  });
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
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
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

// 요청 인터셉터: localStorage 토큰을 프록시로 전달
api.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰 및 refresh token 가져오기
    const currentToken = getCurrentToken();
    let refreshToken: string | null = null;

    if (typeof window !== "undefined") {
      refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    }

    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;

      // refresh token도 헤더에 추가
      if (refreshToken) {
        config.headers["x-refresh-token"] = refreshToken;
      }
    }

    // 디버깅: 토큰 정보 로그
    console.log("🔐 API 요청에 사용되는 토큰:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!currentToken,
      hasRefreshToken: !!refreshToken,
      isGuest: getIsGuest(),
      tokenPreview: currentToken
        ? currentToken.substring(0, 50) + "..."
        : "none",
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

// 질문 상세 정보 가져오기
export const getHealthQuestionDetail = async (id: string) => {
  try {
    const response = await api.get(`/private/health.questions/${id}`);
    return response.data;
  } catch (error) {
    console.error("질문 상세 정보 가져오기 실패:", error);
    throw error;
  }
};

// 퀴즈 문항 가져오기
export const getQuizItems = async (id: string) => {
  try {
    const response = await api.get(`/private/health.questions/${id}/items`);
    return response.data;
  } catch (error) {
    console.error("퀴즈 문항 가져오기 실패:", error);
    throw error;
  }
};

// 퀴즈 진행상태 리셋 (다시 풀기)
export const resetQuizProgress = async (id: string) => {
  try {
    const response = await api.delete(`/private/health.questions/${id}/reset`);
    return response.data;
  } catch (error) {
    console.error("퀴즈 진행상태 리셋 실패:", error);
    throw error;
  }
};

// 퀴즈 답안 제출
export const submitQuizAnswers = async (
  id: string,
  answers: Array<{ questionId: string; choiceId: string }>
) => {
  try {
    console.log("=== API 호출 상세 정보 ===");
    console.log("요청 URL:", `/private/health.questions/${id}/submit`);
    console.log("원본 답변 데이터:", answers);

    // 백엔드 API 형식에 맞게 데이터 변환
    const formattedAnswers = answers.map((answer) => ({
      itemId: parseInt(answer.itemId), // 문자열 → 숫자
      choiceId: parseInt(answer.choiceId), // 문자열 → 숫자
    }));

    console.log("변환된 답변 데이터:", formattedAnswers);
    console.log("답변 배열 길이:", formattedAnswers.length);

    // 각 답변의 타입 확인
    formattedAnswers.forEach((answer, index) => {
      console.log(`답변 ${index + 1} 타입 확인:`, {
        itemId: answer.itemId,
        itemIdType: typeof answer.itemId,
        choiceId: answer.choiceId,
        choiceIdType: typeof answer.choiceId,
        isItemIdValid: !isNaN(answer.itemId),
        isChoiceIdValid: !isNaN(answer.choiceId),
      });
    });

    const response = await api.post(`/private/health.questions/${id}/submit`, {
      answers: formattedAnswers,
    });

    console.log("API 응답 성공:", response.data);
    return response.data;
  } catch (error: unknown) {
    // 퀴즈 답안 제출 실패 처리
    throw error;
  }
};

// 커뮤니티 API 함수
export const getCommunityPosts = async (
  limit: number = 10,
  cursor?: string
) => {
  try {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await api.get(`/private/community?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("커뮤니티 게시글 로딩 실패:", error);
    throw error;
  }
};

// 커뮤니티 상세 게시글 가져오기
export const getCommunityPostDetail = async (postId: string) => {
  try {
    const response = await api.get(`/private/community/${postId}`);
    return response.data;
  } catch (error) {
    console.error("커뮤니티 게시글 상세 로딩 실패:", error);
    throw error;
  }
};

// 커뮤니티 게시글 생성
export const createCommunityPost = async (data: {
  title: string;
  content: string;
  type: "건강질문" | "리뷰";
}) => {
  try {
    // 백엔드 API에서는 type이 "QUESTION" 또는 "REVIEW"로 변환되어야 할 수 있음
    const response = await api.post("/private/community", {
      title: data.title,
      content: data.content,
      type: data.type === "건강질문" ? "QUESTION" : "REVIEW",
    });
    return response.data;
  } catch (error) {
    console.error("커뮤니티 게시글 생성 실패:", error);
    throw error;
  }
};

// 사용자 프로필 정보 조회
export const getUserProfile = async () => {
  try {
    const response = await api.get("/private/register/profile");
    return response.data;
  } catch (error) {
    console.error("사용자 프로필 조회 실패:", error);
    throw error;
  }
};

// 사용자 프로필 정보 수정
export const updateUserProfile = async (data: {
  nickname?: string;
  age?: number;
}) => {
  try {
    const response = await api.put("/private/register/profile", data);
    return response.data;
  } catch (error) {
    console.error("사용자 프로필 수정 실패:", error);
    throw error;
  }
};

export default api;
