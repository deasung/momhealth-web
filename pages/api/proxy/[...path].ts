import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { env } from "../../../lib/env";

// 서버 시작 시 환경 변수 확인 (모듈 로드 시점에 실행)
if (typeof process !== "undefined") {
  const baseURL = env.MOMHEALTH_API_URL();
  const apiKey = env.MOMHEALTH_API_KEY();

  if (!baseURL || !apiKey) {
    console.error("❌ [프록시 API] 환경변수 누락 (서버 시작 시):", {
      MOMHEALTH_API_URL: baseURL || "undefined",
      MOMHEALTH_API_KEY: apiKey ? "설정됨" : "undefined",
      allEnvKeys:
        typeof process !== "undefined" && process.env
          ? Object.keys(process.env).filter((key) => key.includes("MOMHEALTH"))
          : [],
      nodeEnv: env.NODE_ENV(),
    });
  } else {
    console.log("✅ [프록시 API] 환경변수 확인 완료:", {
      MOMHEALTH_API_URL: baseURL ? "설정됨" : "누락",
      MOMHEALTH_API_KEY: apiKey ? "설정됨" : "누락",
      nodeEnv: env.NODE_ENV(),
    });
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path;

  // 서버 사이드에서만 접근 가능한 환경 변수 사용
  // 런타임 환경 변수를 직접 읽기 (EC2/Docker에서 작동하도록)
  // Next.js standalone 모드에서도 Node.js의 process.env는 런타임에 직접 읽을 수 있음
  const baseURL =
    process.env.MOMHEALTH_API_URL ||
    process.env["MOMHEALTH_API_URL"] ||
    env.MOMHEALTH_API_URL();
  const apiKey =
    process.env.MOMHEALTH_API_KEY ||
    process.env["MOMHEALTH_API_KEY"] ||
    env.MOMHEALTH_API_KEY();

  // 디버깅: 환경 변수 확인
  if (!baseURL || !apiKey) {
    const allEnvKeys =
      typeof process !== "undefined" && process.env
        ? Object.keys(process.env).filter((key) => key.includes("MOMHEALTH"))
        : [];

    console.error("❌ 환경변수 누락 (프록시 요청 시):", {
      MOMHEALTH_API_URL: baseURL || "undefined",
      MOMHEALTH_API_KEY: apiKey ? "설정됨" : "undefined",
      allEnvKeys,
      allProcessEnvKeys:
        typeof process !== "undefined" && process.env
          ? Object.keys(process.env).slice(0, 20)
          : [],
      nodeEnv:
        typeof process !== "undefined" && process.env
          ? process.env.NODE_ENV
          : "unknown",
      timestamp: new Date().toISOString(),
    });
    return res.status(500).json({
      error: "서버 설정 오류",
      message: "환경변수가 설정되지 않았습니다.",
      details: {
        MOMHEALTH_API_URL: baseURL ? "설정됨" : "누락",
        MOMHEALTH_API_KEY: apiKey ? "설정됨" : "누락",
      },
    });
  }

  // 클라이언트에서 전달된 토큰 및 refresh token 확인
  const clientToken = req.headers.authorization;
  const clientRefreshToken = req.headers["x-refresh-token"] as string;
  let finalToken = clientToken;

  // 토큰이 없는 경우 게스트 토큰 발급
  if (!clientToken) {
    try {
      const guestTokenResponse = await axios({
        method: "POST",
        url: `${baseURL}/public/auth/token`,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        data: {},
      });

      if (guestTokenResponse.data?.access_token) {
        finalToken = `Bearer ${guestTokenResponse.data.access_token}`;
      }
    } catch (guestError: any) {
      console.error("[API 프록시] 게스트 토큰 발급 실패:", {
        message: guestError.message,
        status: guestError.response?.status,
        data: guestError.response?.data,
      });
    }
  }

  const requestHeaders = {
    "x-api-key": apiKey,
    ...(finalToken && { Authorization: finalToken }),
  };

  // axios 인터셉터로 실제 HTTP 요청/응답 로그
  const axiosInstance = axios.create();

  // 요청 인터셉터
  axiosInstance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  try {
    const response = await axiosInstance({
      method: req.method,
      url: `${baseURL}/${apiPath}`,
      headers: requestHeaders,
      data: req.body,
      params: req.query,
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    // 401 에러인 경우 - refresh token으로 재발급 시도
    if (error.response?.status === 401 && clientRefreshToken) {
      try {
        // refresh token으로 새 access token 발급 요청
        const refreshResponse = await axios({
          method: "POST",
          url: `${baseURL}/public/auth/token/refresh`,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            Authorization: clientToken || "",
          },
          data: {
            refresh_token: clientRefreshToken,
          },
        });

        if (refreshResponse.data?.access_token) {
          // 새 토큰으로 원래 요청 재시도
          const retryResponse = await axiosInstance({
            method: req.method,
            url: `${baseURL}/${apiPath}`,
            headers: {
              "x-api-key": apiKey,
              Authorization: `Bearer ${refreshResponse.data.access_token}`,
            },
            data: req.body,
            params: req.query,
          });

          // 새 토큰을 클라이언트에 전달 (쿠키 또는 헤더로)
          return res.status(retryResponse.status).json({
            ...retryResponse.data,
            _newAccessToken: refreshResponse.data.access_token, // 클라이언트가 토큰 갱신할 수 있도록
          });
        }
      } catch (refreshError: any) {
        console.error("[API 프록시] refresh token 재발급 실패:", {
          message: refreshError.message,
          status: refreshError.response?.status,
          data: refreshError.response?.data,
        });
      }
    }

    // 401 에러인 경우 - 인증 에러로 명확히 전달
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "인증이 필요합니다.",
        requiresAuth: true,
      });
    }

    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
};

export default handler;
