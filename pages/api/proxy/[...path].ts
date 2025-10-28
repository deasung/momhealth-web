import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path;

  // 서버 사이드에서만 접근 가능한 환경 변수 사용
  const baseURL = process.env.MOMHEATH_API_URL || "http://localhost:3000";
  const apiKey =
    process.env.MOMHEATH_API_KEY || "b9d54cc0-5ea5-11ea-b7f9-41b4f2de8659";

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
