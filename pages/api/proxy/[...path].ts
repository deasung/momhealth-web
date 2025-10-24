import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path;

  // 서버 사이드에서만 접근 가능한 환경 변수 사용
  const baseURL = process.env.MOMHEATH_API_URL || "http://localhost:3000";
  const apiKey =
    process.env.MOMHEATH_API_KEY || "b9d54cc0-5ea5-11ea-b7f9-41b4f2de8659";

  console.log(
    `[API 프록시] ${req.method} /${apiPath} -> ${baseURL}/${apiPath}`
  );
  console.log("[API 프록시] 사용할 API 키:", apiKey);

  // 클라이언트에서 전달된 토큰 확인
  const clientToken = req.headers.authorization;
  let finalToken = clientToken;

  console.log("[API 프록시] 클라이언트 토큰:", clientToken ? "있음" : "없음");
  console.log("[API 프록시] 클라이언트 토큰 값:", clientToken);

  // 토큰이 없는 경우 게스트 토큰 발급
  if (!clientToken) {
    console.log("[API 프록시] 토큰 없음 - 게스트 토큰 발급 시도");
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

      console.log("[API 프록시] 게스트 토큰 응답:", {
        status: guestTokenResponse.status,
        data: guestTokenResponse.data,
      });

      if (guestTokenResponse.data?.access_token) {
        finalToken = `Bearer ${guestTokenResponse.data.access_token}`;
        console.log("[API 프록시] 게스트 토큰 발급 성공");
      } else {
        console.error(
          "[API 프록시] 게스트 토큰 응답에 access_token이 없음:",
          guestTokenResponse.data
        );
      }
    } catch (guestError: any) {
      console.error("[API 프록시] 게스트 토큰 발급 실패:", {
        message: guestError.message,
        status: guestError.response?.status,
        data: guestError.response?.data,
      });
    }
  } else {
    console.log("[API 프록시] 클라이언트 토큰 사용");
  }

  console.log("[API 프록시] 최종 사용 토큰:", finalToken);

  const requestHeaders = {
    "x-api-key": apiKey,
    ...(finalToken && { Authorization: finalToken }),
  };

  console.log("[API 프록시] 전송할 헤더:", requestHeaders);
  console.log("[API 프록시] 전송할 URL:", `${baseURL}/${apiPath}`);

  // axios 인터셉터로 실제 HTTP 요청/응답 로그
  const axiosInstance = axios.create();

  // 요청 인터셉터
  axiosInstance.interceptors.request.use(
    (config) => {
      console.log("🚀 [AXIOS 요청] 실제 HTTP 요청 시작:");
      console.log("  URL:", config.url);
      console.log("  Method:", config.method);
      console.log("  Headers:", JSON.stringify(config.headers, null, 2));
      console.log("  Data:", config.data);
      return config;
    },
    (error) => {
      console.error("❌ [AXIOS 요청] 요청 설정 오류:", error);
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  axiosInstance.interceptors.response.use(
    (response) => {
      console.log("✅ [AXIOS 응답] HTTP 응답 성공:");
      console.log("  Status:", response.status);
      console.log("  Headers:", JSON.stringify(response.headers, null, 2));
      console.log("  Data:", JSON.stringify(response.data, null, 2));
      return response;
    },
    (error) => {
      console.error("❌ [AXIOS 응답] HTTP 응답 실패:");
      console.log("  Status:", error.response?.status);
      console.log(
        "  Headers:",
        JSON.stringify(error.response?.headers, null, 2)
      );
      console.log("  Data:", error.response?.data);
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

    console.log(`[API 프록시] 성공: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("[API 프록시] 오류:", {
      url: `${baseURL}/${apiPath}`,
      method: req.method,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });

    // 401 에러인 경우 토큰 갱신 시도
    if (error.response?.status === 401) {
      console.log("[API 프록시] 401 에러 - 토큰 갱신 시도");

      // 1. 먼저 refresh_token으로 토큰 갱신 시도
      if (clientToken) {
        try {
          console.log("[API 프록시] refresh_token으로 토큰 갱신 시도");
          const refreshResponse = await axios({
            method: "POST",
            url: `${baseURL}/public/auth/token/refresh`,
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              Authorization: clientToken,
            },
            data: {},
          });

          if (refreshResponse.data?.access_token) {
            console.log("[API 프록시] refresh_token으로 토큰 갱신 성공");
            const retryResponse = await axios({
              method: req.method,
              url: `${baseURL}/${apiPath}`,
              headers: {
                "x-api-key": apiKey,
                Authorization: `Bearer ${refreshResponse.data.access_token}`,
              },
              data: req.body,
              params: req.query,
            });

            console.log(
              `[API 프록시] 갱신된 토큰으로 재시도 성공: ${retryResponse.status}`
            );
            return res.status(retryResponse.status).json(retryResponse.data);
          }
        } catch (refreshError: any) {
          console.error(
            "[API 프록시] refresh_token 갱신 실패:",
            refreshError.message
          );
        }
      }

      // 2. refresh_token 갱신 실패 시 게스트 토큰으로 재시도
      try {
        console.log("[API 프록시] 게스트 토큰으로 재시도");
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
          const retryResponse = await axios({
            method: req.method,
            url: `${baseURL}/${apiPath}`,
            headers: {
              "x-api-key": apiKey,
              Authorization: `Bearer ${guestTokenResponse.data.access_token}`,
            },
            data: req.body,
            params: req.query,
          });

          console.log(
            `[API 프록시] 게스트 토큰으로 재시도 성공: ${retryResponse.status}`
          );
          return res.status(retryResponse.status).json(retryResponse.data);
        }
      } catch (retryError: any) {
        console.error(
          "[API 프록시] 게스트 토큰 재시도 실패:",
          retryError.message
        );
      }
    }

    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
};

export default handler;
