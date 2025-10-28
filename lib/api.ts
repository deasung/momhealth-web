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
    console.log("✅ API 응답 성공:", {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      dataSize: JSON.stringify(response.data).length,
      responseTime: response.headers["x-response-time"] || "N/A",
    });

    // 특정 API의 경우 더 자세한 로그
    if (
      response.config.url?.includes("/health.questions") ||
      response.config.url?.includes("/community") ||
      response.config.url?.includes("/register")
    ) {
      console.log("📊 상세 응답 데이터:", {
        url: response.config.url,
        dataKeys: Object.keys(response.data || {}),
        hasResults: !!response.data?.results,
        resultsLength: response.data?.results?.length || 0,
        hasNextCursor: !!response.data?.nextCursor,
      });
    }

    return response;
  },
  (error) => {
    console.error("❌ API 요청 실패:", {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      errorData: error.response?.data,
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

// 커뮤니티 게시글 수정
export const updateCommunityPost = async (
  postId: string,
  data: {
    title: string;
    content: string;
    type: "건강질문" | "리뷰";
  }
) => {
  try {
    const response = await api.put(`/private/community/${postId}`, {
      title: data.title,
      content: data.content,
      type: data.type === "건강질문" ? "QUESTION" : "REVIEW",
    });
    return response.data;
  } catch (error) {
    console.error("커뮤니티 게시글 수정 실패:", error);
    throw error;
  }
};

// 커뮤니티 게시글 삭제
export const deleteCommunityPost = async (postId: string) => {
  try {
    const response = await api.delete(`/private/community/${postId}`);
    return response.data;
  } catch (error) {
    console.error("커뮤니티 게시글 삭제 실패:", error);
    throw error;
  }
};

// 댓글 등록
export const createComment = async (postId: string, content: string) => {
  try {
    const response = await api.post(`/private/community/${postId}/comments`, {
      content,
    });
    return response.data;
  } catch (error) {
    console.error("댓글 등록 실패:", error);
    throw error;
  }
};

// 댓글 삭제
export const deleteComment = async (postId: string, commentId: string) => {
  try {
    const response = await api.delete(
      `/private/community/${postId}/comments/${commentId}`
    );
    return response.data;
  } catch (error) {
    console.error("댓글 삭제 실패:", error);
    throw error;
  }
};

// 댓글 수정
export const updateComment = async (
  postId: string,
  commentId: string,
  content: string
) => {
  try {
    const response = await api.put(
      `/private/community/${postId}/comments/${commentId}`,
      {
        content,
      }
    );
    return response.data;
  } catch (error) {
    console.error("댓글 수정 실패:", error);
    throw error;
  }
};

// 공개 정책: 개인정보 처리방침 조회
export const getPrivacyPolicy = async () => {
  try {
    const response = await api.get("/public/policy/privacy");
    return response.data;
  } catch (error) {
    console.error("개인정보 처리방침 조회 실패:", error);
    throw error;
  }
};

// 공개 정책: 서비스 이용약관 조회
export const getServiceTerms = async () => {
  try {
    const response = await api.get("/public/policy/terms");
    return response.data;
  } catch (error) {
    console.error("서비스 이용약관 조회 실패:", error);
    throw error;
  }
};

// ===== Friends: Search / Request / Cancel / Invite =====
export interface SearchUsersResponse {
  users: Array<{
    id: number;
    email: string;
    nickname: string;
    age: number;
    userThumbnailUrl: string | null;
    createdAt: string;
    mappingStatus: "ACCEPTED" | "PENDING" | "NONE";
    isMapped: boolean;
    mappingId?: string;
  }>;
  nextCursor: string | null;
  canSendEmail?: boolean;
}

export const searchUsers = async (params: {
  query: string;
  cursor?: string;
}) => {
  const response = await api.get("/private/register/search", { params });
  return response.data as SearchUsersResponse;
};

export const sendFriendRequest = async (mappedUserId: number) => {
  const response = await api.post("/private/register/mapped-users", {
    mappedUserId,
  });
  return response.data;
};

export const cancelFriendRequestByMappingId = async (mappingId: string) => {
  const response = await api.delete(
    `/private/register/mapped-users/${mappingId}/cancel`
  );
  return response.data;
};

export const inviteFriendByEmail = async (email: string) => {
  const response = await api.post("/private/register/invite", { email });
  return response.data;
};

// ===== File Upload: Profile Thumbnail =====
export const getPresignedPost = async (fileExt: string, group: string) => {
  const response = await api.get("/public/aws/s3-presigned-post", {
    params: { file_ext: fileExt, group },
  });
  return response.data;
};

// path-style URL을 virtual-hosted 스타일로 변환
const toVhostUrl = (url: string, bucket?: string) => {
  // ex) https://s3.ap-northeast-2.amazonaws.com/moms40-dev  -> https://moms40-dev.s3.ap-northeast-2.amazonaws.com/
  const m = url.match(/^https:\/\/s3\.([a-z0-9-]+)\.amazonaws\.com\/(.+)$/);
  if (m && bucket) {
    const region = m[1];
    return `https://${bucket}.s3.${region}.amazonaws.com/`;
  }
  return url.endsWith("/") ? url : url + "/";
};

export const uploadThumbnail = async (
  file: File,
  group: "profile" | "community" | "misc" = "profile"
): Promise<{ thumbnailUrl: string }> => {
  const fileExt = (file.name.split(".").pop() || "").toLowerCase();
  if (!fileExt) throw new Error("파일 확장자를 확인할 수 없습니다.");

  // 1) presigned POST 수신
  const presigned = await getPresignedPost(fileExt, group);
  const { url, fields } = presigned;
  if (!url || !fields?.key) throw new Error("Presigned POST 응답 형식 오류");

  // 2) FormData 구성 (bucket 필드는 제외)
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (k !== "bucket") formData.append(k, String(v));
  });

  // 3) 웹 File 객체로 직접 첨부
  formData.append("file", file, file.name);

  // 4) URL을 virtual-hosted 로 변환해서 업로드
  const postUrl = toVhostUrl(url, (fields as { bucket?: string }).bucket);

  // 5) 업로드
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 30000);

  let resp: Response;
  try {
    resp = await fetch(postUrl, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      // 헤더에 Content-Type 지정 ❌  (FormData가 boundary 포함해서 자동 지정)
    });
  } catch (e: unknown) {
    const error = e as { name?: string; message?: string };
    if (error.name === "AbortError")
      throw new Error("S3 업로드가 시간 초과되었습니다.");
    throw new Error(
      `네트워크 요청 실패: ${error?.message || "알 수 없는 오류"}`
    );
  } finally {
    clearTimeout(to);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `S3 업로드 실패 (${resp.status}): ${text || resp.statusText}`
    );
  }

  return { thumbnailUrl: fields.key };
};

// 내가 작성한 커뮤니티 게시글 목록 조회
export const getMyCommunityPosts = async (params?: {
  limit?: number;
  cursor?: number;
  type?: "QUESTION" | "REVIEW" | "ALL";
}) => {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(([_, v]) => v !== undefined)
    );
    const response = await api.get("/private/community/my-posts", {
      params: cleanParams,
    });
    return {
      posts: response.data.posts,
      nextCursor: response.data.nextCursor ?? null,
    };
  } catch (error) {
    console.error("내 게시글 목록 조회 실패:", error);
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
  userThumbnailUrl?: string;
}) => {
  try {
    const response = await api.put("/private/register/profile", data);
    return response.data;
  } catch (error) {
    console.error("사용자 프로필 수정 실패:", error);
    throw error;
  }
};

// 매핑된 사용자 목록 조회 (친구 목록)
export const getMappedUsers = async () => {
  try {
    const response = await api.get("/private/register/mapped-users");
    return response.data;
  } catch (error) {
    console.error("매핑된 사용자 목록 조회 실패:", error);
    throw error;
  }
};

// 친구 요청 카운트 조회
export const getFriendRequestCounts = async () => {
  try {
    const response = await api.get("/private/register/friend-requests");
    return response.data;
  } catch (error) {
    console.error("친구 요청 카운트 조회 실패:", error);
    throw error;
  }
};

// 보낸 친구 요청 조회
export const getSentRequests = async () => {
  try {
    const response = await api.get("/private/register/friend-requests/sent");
    return response.data;
  } catch (error) {
    console.error("보낸 친구 요청 조회 실패:", error);
    throw error;
  }
};

// 받은 친구 요청 조회
export const getReceivedRequests = async () => {
  try {
    const response = await api.get(
      "/private/register/friend-requests/received"
    );
    return response.data;
  } catch (error) {
    console.error("받은 친구 요청 조회 실패:", error);
    throw error;
  }
};

// 친구 요청 수락
export const acceptFriendRequest = async (requestId: number) => {
  try {
    const response = await api.put(
      `/private/register/mapped-users/${requestId}`,
      {
        action: "accept",
      }
    );
    return response.data;
  } catch (error) {
    console.error("친구 요청 수락 실패:", error);
    throw error;
  }
};

// 친구 요청 취소
export const cancelFriendRequest = async (requestId: number) => {
  try {
    const response = await api.delete(
      `/private/register/mapped-users/${requestId}/cancel`
    );
    return response.data;
  } catch (error) {
    console.error("친구 요청 취소 실패:", error);
    throw error;
  }
};

// 공지사항 목록 조회
export const getNotices = async (params: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  try {
    const response = await api.get("/public/notice/list", { params });
    return response.data;
  } catch (error) {
    console.error("공지사항 목록 조회 실패:", error);
    throw error;
  }
};

// 공지사항 상세 조회
export const getNoticeDetail = async (id: string) => {
  try {
    const response = await api.get(`/public/notice/${id}`);
    return response.data;
  } catch (error) {
    console.error("공지사항 상세 조회 실패:", error);
    throw error;
  }
};

// 사용자의 완료한 건강 질문 조회
export const getUserCompletedQuestions = async (params: {
  userId: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await api.get("/private/health.questions/user/completed", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("사용자의 완료한 건강 질문 조회 실패:", error);
    throw error;
  }
};

export default api;
